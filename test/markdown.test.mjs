import assert from "node:assert/strict";
import test from "node:test";

import { sebastianTheme } from "../dist/markdown.js";

const LOGO_URL = "https://sebastian-brand.vercel.app/sebastian-software/logo-software.svg";

test("returns a compact centered logo opening and branded closing", () => {
  const frame = sebastianTheme({ copyrightYears: "2026" });

  assert.match(frame.opening, /<p align="center">/);
  assert.ok(frame.opening.includes('<a href="https://oss.sebastian-software.com">'));
  assert.ok(frame.opening.includes(`<img src="${LOGO_URL}"`));
  assert.match(frame.opening, /alt="Sebastian Software"/);
  assert.match(frame.closing, /^---\n\n/);
  assert.match(frame.closing, /Built by Sebastian Software/);
  assert.match(frame.closing, /consulting for TypeScript, React &amp; Rust\./);
  assert.match(frame.closing, /Work with us/);
  assert.match(frame.closing, /More open source/);
  assert.match(frame.closing, /Copyright &copy; 2026 Sebastian Software GmbH/);
  assert.equal(frame.closing.includes(LOGO_URL), false);
  assert.equal(frame.opening.includes("sebastian-software-branding:start"), false);
});

test("supports deterministic year and link overrides", () => {
  const options = {
    copyrightYears: "2020-2026",
    links: {
      openSource: "https://example.com/oss?team=1&channel=web",
      workWithUs: "https://example.com/contact",
      moreOpenSource: "https://example.com/oss",
    },
  };
  const first = sebastianTheme(options);
  const second = sebastianTheme(options);

  assert.deepEqual(first, second);
  assert.match(first.opening, /href="https:\/\/example\.com\/oss\?team=1&amp;channel=web"/);
  assert.match(first.closing, /href="https:\/\/example\.com\/contact">Work with us<\/a>/);
  assert.match(first.closing, /Copyright &copy; 2020-2026 Sebastian Software GmbH/);
});

test("does not mutate options or share mutable frame output", () => {
  const options = {
    copyrightYears: "2026",
    links: { workWithUs: "https://example.com/contact" },
  };
  const before = structuredClone(options);
  const frame = sebastianTheme(options);
  assert.deepEqual(options, before);
  options.links.workWithUs = "https://example.com/changed";
  frame.opening = "changed";

  const fresh = sebastianTheme(options);
  assert.ok(fresh.opening.includes(LOGO_URL));
  assert.match(fresh.closing, /https:\/\/example\.com\/changed/);
});

test("rejects unsafe URLs, year text, and unknown option keys", () => {
  assert.throws(
    () => sebastianTheme({ copyrightYears: "2026", links: { workWithUs: "http://example.com" } }),
    /HTTPS URL/,
  );
  const unsafeProtocol = ["java", "script:"].join("");
  assert.throws(
    () =>
      sebastianTheme({
        copyrightYears: "2026",
        links: { workWithUs: `${unsafeProtocol}alert(1)` },
      }),
    /HTTPS URL/,
  );
  assert.throws(() => sebastianTheme({ copyrightYears: "2026</p><script>" }), /year or year range/);
  assert.throws(() => sebastianTheme({ copyrightYears: "2026-2020" }), /ascending/);
  assert.throws(() => sebastianTheme({ copyrightYears: "0000" }), /year or year range/);
  assert.throws(() => sebastianTheme(), /options must be an object/);
  assert.throws(
    () => sebastianTheme({ copyrightYears: "2026", links: null }),
    /links must be an object/,
  );
  assert.throws(
    () => sebastianTheme({ copyrightYears: "2026", links: { openSource: null } }),
    /HTTPS URL/,
  );
  assert.throws(
    () =>
      sebastianTheme({
        copyrightYears: "2026",
        links: { openSource: "https://user:pass@example.com" },
      }),
    /HTTPS URL/,
  );
  assert.throws(() => sebastianTheme({ unknown: "value" }), /unknown theme option/);
});

test("escapes attribute delimiters and rejects URL control characters", () => {
  const frame = sebastianTheme({
    copyrightYears: "2026",
    links: { workWithUs: "https://example.com/?q=\"<>&'" },
  });
  assert.ok(frame.closing.includes('href="https://example.com/?q=&quot;&lt;&gt;&amp;&#39;"'));
  assert.throws(
    () =>
      sebastianTheme({
        copyrightYears: "2026",
        links: { workWithUs: "https://example.com/\npath" },
      }),
    /HTTPS URL/,
  );
});

test("is structurally composable as an outer Markdown frame", async () => {
  const { renderMarkdown } = await import("markdown-themer");
  const frame = sebastianTheme({ copyrightYears: "2026" });
  const inner = { opening: "<!-- inner opening -->", closing: "<!-- inner closing -->" };
  const result = await renderMarkdown("# Project content\n", [frame, inner]);

  assert.ok(result.includes(frame.opening));
  assert.ok(result.indexOf(frame.opening) < result.indexOf(inner.opening));
  assert.ok(result.indexOf(inner.opening) < result.indexOf("# Project content"));
  assert.ok(result.indexOf("# Project content") < result.indexOf(inner.closing));
  assert.ok(result.indexOf(inner.closing) < result.indexOf("Copyright &copy; 2026"));
});
