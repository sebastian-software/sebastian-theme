# Start with an independent Markdown frame

Status: accepted

## Decision

`sebastian-theme/markdown` exports a pure factory returning opening and closing
strings. It depends on no renderer or browser runtime. `markdown-themer` uses
that structural frame as its outermost theme; other renderers may use it too.

The opening contains one compact, linked Sebastian Software logo. The closing
contains company links and the legal copyright notice. The project authors the
intervening corpus. A family frame can be nested between company and project.
GitHub controls fonts and page styling; this Markdown export does not promise
website CSS capabilities.

Copyright years are explicit configuration, never derived from the system clock.
Logo artwork remains at its existing canonical URL in `sebastian-brand`; the
factory does not fetch it during generation. Fonts and logo artwork are not
redistributed or relicensed by the package.

The planned React layouts and scoped styles are independent future exports.
They will not add browser dependencies to the Markdown entry or require its
configuration to match website composition.

## Distribution and dogfooding

Until registry publication, consumers pin immutable Git commits. The repository
commits compiled `dist/`, advertises its compiled `main`, and checks for stale
build output in CI. It has no `prepare` lifecycle. A packed consumer verifies
the public API and its composition with the actual Markdown tool.

The repository generates its own README from `README.md.src`. Standards has an
explicit ownership opt-in and continues to govern all its other files. The
README generation and standards checks both run in CI.
