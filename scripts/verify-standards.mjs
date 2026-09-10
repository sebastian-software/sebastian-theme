import { execFile } from "node:child_process";
import { mkdir, mkdtemp, readFile, rm, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const packageRoot = process.cwd();
const markdownCli = resolve(packageRoot, "node_modules/.bin/markdown-themer");
const standardsCli = resolve(packageRoot, "node_modules/.bin/standards");
const markdownRuntime = pathToFileURL(
  resolve(packageRoot, "node_modules/markdown-themer/dist/index.js"),
).href;
const themeRuntime = pathToFileURL(resolve(packageRoot, "dist/markdown.js")).href;

async function run(command, args, { cwd, expectedCodes = [0] }) {
  try {
    const result = await execFileAsync(command, args, {
      cwd,
      maxBuffer: 1024 * 1024 * 4,
    });
    return { code: 0, stdout: result.stdout, stderr: result.stderr };
  } catch (error) {
    if (typeof error.code !== "number") {
      throw new TypeError(
        `${command} ${args.join(" ")} failed: ${error.message ?? String(error)}`,
        {
          cause: error,
        },
      );
    }
    const result = {
      code: error.code,
      stdout: error.stdout ?? "",
      stderr: error.stderr ?? "",
    };
    if (!expectedCodes.includes(result.code)) {
      throw new Error(
        `${command} ${args.join(" ")} exited with ${String(result.code)}\n${result.stdout}${result.stderr}`,
        { cause: error },
      );
    }
    return result;
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function writeFixture(cwd) {
  await mkdir(join(cwd, ".github", "workflows"), { recursive: true });
  await writeFile(
    join(cwd, "README.md.src"),
    "# standards consumer\n\nThe authored source must survive standards apply.\n",
  );
  await writeFile(
    join(cwd, "markdown-themer.config.mjs"),
    `import { defineConfig } from ${JSON.stringify(markdownRuntime)};\nimport { sebastianTheme } from ${JSON.stringify(themeRuntime)};\n\nexport default defineConfig({\n  source: "README.md.src",\n  output: "README.md",\n  themes: [sebastianTheme({ copyrightYears: "2026" })],\n});\n`,
  );
  await writeFile(
    join(cwd, "package.json"),
    `${JSON.stringify(
      {
        scripts: {
          "readme:write": "markdown-themer --write",
          "readme:check": "markdown-themer --check",
        },
      },
      undefined,
      2,
    )}\n`,
  );
  await writeFile(
    join(cwd, ".github", "workflows", "ci.yml"),
    "name: ci\njobs:\n  check:\n    steps:\n      - run: pnpm readme:check\n",
  );
  await writeFile(
    join(cwd, ".repometa.json"),
    `${JSON.stringify(
      {
        standards: 13,
        visibility: "oss",
        since: 2026,
        platform: "github",
        readme: { owner: "markdown-themer" },
      },
      undefined,
      2,
    )}\n`,
  );
  await run(markdownCli, ["--write"], { cwd });
}

async function snapshot(cwd) {
  let source;
  try {
    source = await readFile(join(cwd, "README.md.src"));
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
  const [output, outputStat] = await Promise.all([
    readFile(join(cwd, "README.md")),
    stat(join(cwd, "README.md")),
  ]);
  return { source, output, mtimeMs: outputStat.mtimeMs };
}

async function assertReadmeUnchanged(cwd, before, label) {
  const after = await snapshot(cwd);
  assert(
    (after.source === undefined) === (before.source === undefined),
    `${label} changed README.md.src presence`,
  );
  if (after.source !== undefined && before.source !== undefined) {
    assert(Buffer.compare(after.source, before.source) === 0, `${label} changed README.md.src`);
  }
  assert(Buffer.compare(after.output, before.output) === 0, `${label} changed README.md`);
  assert(after.mtimeMs === before.mtimeMs, `${label} changed README.md metadata`);
}

async function verifyValidOwner() {
  const cwd = await mkdtemp(join(tmpdir(), "sebastian-standards-valid-"));
  try {
    await writeFixture(cwd);
    const beforeApply = await snapshot(cwd);
    const applied = await run(standardsCli, ["apply", "--cwd", cwd], { cwd: packageRoot });
    assert(applied.code === 0, "standards apply failed for a valid markdown-themer owner");
    await assertReadmeUnchanged(cwd, beforeApply, "standards apply");

    const checked = await run(standardsCli, ["check", "--cwd", cwd], { cwd: packageRoot });
    assert(checked.code === 0, `standards check found drift after apply:\n${checked.stdout}`);
    await assertReadmeUnchanged(cwd, beforeApply, "standards check");

    const markdownCheck = await run(markdownCli, ["--check"], { cwd });
    assert(markdownCheck.code === 0, "markdown-themer check failed after standards apply");
  } finally {
    await rm(cwd, { recursive: true, force: true });
  }
}

async function verifyInvalidOwnerMutationGuard(mutate, label) {
  const cwd = await mkdtemp(join(tmpdir(), `sebastian-standards-${label}-`));
  try {
    await writeFixture(cwd);
    await run(standardsCli, ["apply", "--cwd", cwd], { cwd: packageRoot });
    await run(standardsCli, ["check", "--cwd", cwd], { cwd: packageRoot });
    await mutate(cwd);
    const before = await snapshot(cwd);
    const checked = await run(standardsCli, ["check", "--cwd", cwd], {
      cwd: packageRoot,
      expectedCodes: [1],
    });
    assert(checked.code === 1, `${label} migration issue did not fail standards check`);
    await assertReadmeUnchanged(cwd, before, `standards check (${label})`);

    const applied = await run(standardsCli, ["apply", "--cwd", cwd], {
      cwd: packageRoot,
      expectedCodes: [1],
    });
    assert(applied.code === 1, `${label} migration issue did not fail standards apply`);
    await assertReadmeUnchanged(cwd, before, `standards apply (${label})`);
  } finally {
    await rm(cwd, { recursive: true, force: true });
  }
}

await verifyValidOwner();
await verifyInvalidOwnerMutationGuard(async (cwd) => {
  await rm(join(cwd, "README.md.src"));
}, "missing-source");
await verifyInvalidOwnerMutationGuard(async (cwd) => {
  const packagePath = join(cwd, "package.json");
  const packageJson = JSON.parse(await readFile(packagePath, "utf8"));
  delete packageJson.scripts["readme:check"];
  await writeFile(packagePath, `${JSON.stringify(packageJson, undefined, 2)}\n`);
}, "missing-check-script");
console.log("sebastian-theme standards interoperability verification passed");
