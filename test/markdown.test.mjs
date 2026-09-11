import { renderMarkdown } from "markdown-themer";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { copyFile, mkdir, mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import { sebastianTheme } from "../dist/markdown.js";

test("wraps project content and an inner theme in the fixed company identity", async () => {
  const frame = sebastianTheme("2020-2026");
  const inner = { opening: "<!-- family header -->", closing: "<!-- family footer -->" };
  const source = "# Project\n\n[Guide](docs/guide.md)\n";
  const result = await renderMarkdown(source, [frame, inner]);
  const sections = [
    "logo-software.svg",
    inner.opening,
    source.trim(),
    inner.closing,
    "Powered by Sebastian Software",
    "Copyright &copy; 2020-2026 Sebastian Software GmbH",
  ];
  let previous = -1;
  for (const section of sections) {
    const position = result.indexOf(section);
    assert.ok(position > previous, `Missing or misplaced section: ${section}`);
    previous = position;
  }
  assert.equal(await renderMarkdown(source, [sebastianTheme("2020-2026"), inner]), result);
});

test("native Git theme matches the existing company frame", async () => {
  const frame = sebastianTheme("2026");
  const header = await readFile(new URL("../markdown/header.md", import.meta.url), "utf8");
  const footer = await readFile(new URL("../markdown/footer.md", import.meta.url), "utf8");
  assert.equal(header.trimEnd(), frame.opening);
  assert.equal(footer.trimEnd(), frame.closing);
});

test("native Git theme retains LF when automatic CRLF conversion is enabled", async () => {
  const directory = await mkdtemp(join(tmpdir(), "sebastian-theme-eol-"));
  try {
    await mkdir(join(directory, "markdown"));
    for (const file of [".gitattributes", "markdown/header.md", "markdown/footer.md"]) {
      await copyFile(new URL(`../${file}`, import.meta.url), join(directory, file));
    }
    const git = (...args) =>
      execFileSync("git", ["-c", "core.autocrlf=true", ...args], { cwd: directory });
    git("init", "--quiet");
    git("add", ".");
    await rm(join(directory, "markdown"), { recursive: true });
    git("checkout-index", "--all");
    for (const file of ["header.md", "footer.md"]) {
      const checkedOut = await readFile(join(directory, "markdown", file), "utf8");
      assert.ok(checkedOut.includes("\n"));
      assert.ok(!checkedOut.includes("\r"), `${file} must use LF line endings`);
    }
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
