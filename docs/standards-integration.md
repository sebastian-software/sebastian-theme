# Standards README ownership

This repository uses the released native ownership contract in standards.
`.repometa.json` declares `readme.owner: "mdtheme"`; authored content lives in
`README.md.src` and the data-only configuration in `mdtheme.yaml`. Standards
checks that contract and leaves the generated README alone.

The old standards 0.10 patch is no longer needed. The dependency and lockfile
pin the supporting release; both `standards check` and native `readme:check`
run in CI. `pnpm verify:standards` verifies apply/check/write interoperability
and incomplete-configuration failures in an isolated native consumer.

The legacy renderer remains a development dependency for factory API and
installed-package compatibility tests. It does not generate this README.
