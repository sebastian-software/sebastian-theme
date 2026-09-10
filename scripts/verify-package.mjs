import { execFile } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdtemp, readFile, rm, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const packageRoot = process.cwd();

async function run(command, args, options) {
  const { cwd, expectedCodes = [0], env: extraEnv = {} } = options;
  try {
    const result = await execFileAsync(command, args, {
      cwd,
      env: { ...process.env, ...extraEnv },
      maxBuffer: 1024 * 1024 * 8,
    });
    return { ...result, code: 0 };
  } catch (error) {
    if (typeof error.code !== "number") {
      throw new TypeError(
        `${command} ${args.join(" ")} failed: ${error.message ?? String(error)}`,
        {
          cause: error,
        },
      );
    }
    const code = error.code;
    const stdout = error.stdout ?? "";
    const stderr = error.stderr ?? "";
    if (!expectedCodes.includes(code)) {
      throw new Error(`${command} ${args.join(" ")} exited with ${code}\n${stdout}${stderr}`, {
        cause: error,
      });
    }
    return { stdout, stderr, code };
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function packFilename(stdout) {
  const starts = [];
  for (let index = stdout.indexOf("["); index !== -1; index = stdout.indexOf("[", index + 1)) {
    starts.push(index);
  }
  for (const start of starts.toReversed()) {
    try {
      const value = JSON.parse(stdout.slice(start));
      if (Array.isArray(value) && typeof value[0]?.filename === "string") return value[0].filename;
    } catch {
      // npm lifecycle output can precede its final JSON result.
    }
  }
  throw new Error(`npm pack did not return a tarball filename:\n${stdout}`);
}

const consumerRoot = await mkdtemp(join(tmpdir(), "sebastian-theme-verify-"));
const themeOnlyRoot = await mkdtemp(join(tmpdir(), "sebastian-theme-only-"));
const packRoot = await mkdtemp(join(tmpdir(), "sebastian-theme-pack-"));
const npmCache = join(consumerRoot, ".npm-cache");
const npmEnv = { npm_config_cache: npmCache };

try {
  const packedTheme = await run("npm", ["pack", "--json", "--pack-destination", packRoot], {
    cwd: packageRoot,
    env: npmEnv,
  });
  const themeTarball = join(packRoot, packFilename(packedTheme.stdout));

  const installedTool = resolve(packageRoot, "node_modules/markdown-themer");
  assert(
    existsSync(join(installedTool, "package.json")),
    "expected installed markdown-themer Git dependency",
  );
  const packedTool = await run(
    "npm",
    ["pack", "--ignore-scripts", "--json", "--pack-destination", packRoot],
    { cwd: installedTool, env: npmEnv },
  );
  const toolTarball = join(packRoot, packFilename(packedTool.stdout));

  // Install the theme by itself before the tool. Its Markdown entry point must
  // be usable without markdown-themer, React, or any other runtime package.
  await run("npm", ["init", "--yes"], { cwd: themeOnlyRoot, env: npmEnv });
  await run("npm", ["install", "--ignore-scripts", themeTarball], {
    cwd: themeOnlyRoot,
    env: npmEnv,
  });
  assert(
    !existsSync(join(themeOnlyRoot, "node_modules/markdown-themer")),
    "theme-only install unexpectedly included markdown-themer",
  );
  assert(
    !existsSync(join(themeOnlyRoot, "node_modules/react")),
    "theme-only install unexpectedly included React",
  );
  const themeOnlyCheck = join(themeOnlyRoot, "theme-only-check.mjs");
  await writeFile(
    themeOnlyCheck,
    `import { sebastianTheme } from "sebastian-theme/markdown";\n\nconst frame = sebastianTheme("2026");\nif (!frame.opening.includes("<p align=\\"center\\">") || !frame.closing.includes("Copyright &copy; 2026")) process.exit(1);\n`,
  );
  await run(process.execPath, [themeOnlyCheck], { cwd: themeOnlyRoot, env: npmEnv });

  await run("npm", ["init", "--yes"], { cwd: consumerRoot, env: npmEnv });
  await run("npm", ["install", "--ignore-scripts", themeTarball, toolTarball], {
    cwd: consumerRoot,
    env: npmEnv,
  });

  await writeFile(
    join(consumerRoot, "inner-frame.ts"),
    `import type { MarkdownFrame } from "markdown-themer";\n\nexport function innerFrame(): MarkdownFrame {\n  return { opening: "<section>\\n", closing: "\\n</section>\\n" };\n}\n`,
  );
  await writeFile(
    join(consumerRoot, "markdown-themer.config.ts"),
    `import { defineConfig } from "markdown-themer";\nimport { sebastianTheme } from "sebastian-theme/markdown";\nimport { innerFrame } from "./inner-frame.ts";\n\nexport default defineConfig({\n  source: "README.md.src",\n  output: "README.md",\n  themes: [sebastianTheme("2026"), innerFrame()],\n});\n`,
  );
  await writeFile(
    join(consumerRoot, "README.md.src"),
    "# Packed Sebastian consumer\n\nThis corpus remains ordinary GitHub Markdown.\n",
  );
  await writeFile(
    join(consumerRoot, "consumer-types.ts"),
    `import { defineConfig, renderMarkdown } from "markdown-themer";\nimport type { Config, MarkdownFrame } from "markdown-themer";\nimport { sebastianTheme } from "sebastian-theme/markdown";\n\nconst frame: MarkdownFrame = sebastianTheme("2026");\nconst config: Config = defineConfig({ themes: [frame] });\nvoid config;\nvoid renderMarkdown("# Types\\n", [frame]);\n`,
  );
  await writeFile(
    join(consumerRoot, "tsconfig.json"),
    JSON.stringify(
      {
        compilerOptions: {
          allowImportingTsExtensions: true,
          module: "NodeNext",
          moduleResolution: "NodeNext",
          noEmit: true,
          strict: true,
          target: "ES2024",
        },
        files: ["consumer-types.ts"],
      },
      null,
      2,
    ),
  );
  const tsc = resolve(packageRoot, "node_modules/.bin/tsc");
  await run(tsc, ["--project", join(consumerRoot, "tsconfig.json")], {
    cwd: consumerRoot,
    env: npmEnv,
  });

  const cli = join(consumerRoot, "node_modules/.bin/markdown-themer");
  const source = join(consumerRoot, "README.md.src");
  const output = join(consumerRoot, "README.md");
  const sourceBefore = await readFile(source);
  await run(cli, ["--write"], { cwd: consumerRoot, env: npmEnv });
  const generated = await readFile(output, "utf8");
  assert(generated.includes("logo-software.svg"), "CLI did not render the Sebastian logo header");
  assert(
    generated.includes("Copyright &copy; 2026 Sebastian Software GmbH"),
    "CLI did not render the theme footer",
  );
  assert(
    generated.includes("# Packed Sebastian consumer"),
    "CLI output does not contain source Markdown",
  );
  const sourcePosition = generated.indexOf("# Packed Sebastian consumer");
  const innerClosePosition = generated.indexOf("</section>");
  const footerPosition = generated.indexOf("Powered by Sebastian Software");
  assert(
    sourcePosition !== -1 &&
      innerClosePosition > sourcePosition &&
      innerClosePosition < footerPosition,
    "inner frame did not close before Sebastian footer",
  );
  await run(cli, ["--check"], { cwd: consumerRoot, env: npmEnv });

  const beforeCheck = await readFile(output);
  const drifted = Buffer.concat([beforeCheck, Buffer.from("\nDrift introduced by verifier.\n")]);
  await writeFile(output, drifted);
  const driftStat = await stat(output);
  const check = await run(cli, ["--check"], { cwd: consumerRoot, env: npmEnv, expectedCodes: [1] });
  assert(check.code === 1, "CLI check did not report drift with exit status 1");
  const afterCheck = await readFile(output);
  const afterCheckStat = await stat(output);
  assert(Buffer.compare(afterCheck, drifted) === 0, "CLI check unexpectedly rewrote output");
  assert(afterCheckStat.mtimeMs === driftStat.mtimeMs, "CLI check changed output metadata");

  await run(cli, ["--write"], { cwd: consumerRoot, env: npmEnv });
  await run(cli, ["--check"], { cwd: consumerRoot, env: npmEnv });
  const sourceAfter = await readFile(source);
  assert(Buffer.compare(sourceAfter, sourceBefore) === 0, "CLI write mutated the source file");
  console.log("sebastian-theme package consumer verification passed");
} finally {
  await Promise.all([
    rm(consumerRoot, { recursive: true, force: true }),
    rm(themeOnlyRoot, { recursive: true, force: true }),
    rm(packRoot, { recursive: true, force: true }),
  ]);
}
