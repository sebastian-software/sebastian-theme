import { renderMarkdown } from "markdown-themer";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
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
