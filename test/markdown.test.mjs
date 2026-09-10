import { renderMarkdown } from "markdown-themer";
import assert from "node:assert/strict";
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
    "Built by Sebastian Software",
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
