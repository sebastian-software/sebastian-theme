# Usage

`sebastian-theme/markdown` exports the Markdown frame factory. It is intended
for a `markdown-themer` config that generates one committed README from an
authored source file.

## Configure a repository

Install both packages from immutable Git commits while they are unpublished:

```json
{
  "devDependencies": {
    "markdown-themer": "git+https://github.com/sebastian-software/markdown-themer.git#<markdown-themer-commit>",
    "sebastian-theme": "git+https://github.com/sebastian-software/sebastian-theme.git#<sebastian-theme-commit>"
  }
}
```

Replace the placeholders with reviewed immutable commits. Do not use a moving
branch. The packages carry
their committed build output and have no `prepare` step for consumers to rely
on.

Create `README.md.src` with the project prose and add a local config:

```ts
import { defineConfig } from "markdown-themer";
import { sebastianTheme } from "sebastian-theme/markdown";

export default defineConfig({
  source: "README.md.src",
  output: "README.md",
  themes: [sebastianTheme("2026")],
});
```

Then generate and verify the committed output:

```sh
pnpm exec markdown-themer --write
pnpm exec markdown-themer --check
```

`copyrightYears` is supplied by the consumer so the footer reflects the
repository's chosen copyright range. Keep the value deterministic. The frame
uses canonical hosted logo artwork and its own footer links; do not copy logo
files or fonts into the consumer repository.

## What the frame can control

The Markdown entry point controls the opening and closing Markdown/HTML
fragments around the corpus. GitHub and other hosts control the page's CSS and
font environment. As a result, the frame can provide alignment and links in
the Markdown it emits, but it cannot install arbitrary CSS, force a custom
font, or reproduce a complete website shell.

The package's Markdown entry point does not depend on React. Any future
system-font web styling or Vanilla Extract React component belongs in a
separate export with its own contract; consumers should use only the documented
`sebastian-theme/markdown` entry point today.

## Dogfood this repository

This repository keeps its corpus in `README.md.src` and its generated output in
`README.md`. Run `pnpm install --frozen-lockfile`, `pnpm build`, and then
`pnpm readme:write` from the repository root. Review the generated diff and run
`pnpm readme:check` in CI. The source remains the editable document.

## Standards integration

For repositories managed by standards, use the explicit README ownership opt-in
and the [versioned integration bridge](standards-integration.md) until the
supporting standards release is available. Both generators' checks run in CI.
