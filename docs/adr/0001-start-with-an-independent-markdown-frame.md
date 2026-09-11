# Start with an independent Markdown frame

Status: accepted
Updated: 2026-09-11

## Decision

Native mdtheme consumers read `markdown/header.md` and `markdown/footer.md`
directly from Git. This is the primary documented interface. The directory is
committed and included in package archives. It contains only Markdown/HTML;
consumer generation does not execute code or install theme dependencies.

Git consumers may follow `main` or choose a tag or commit. The choice belongs
to each project and is independent of its mdtheme CLI version. The shared
copyright notice is authored explicitly in the footer and changes by review.

The existing factory API remains available for its current consumers. Tests
keep the native frame's shared content aligned with that API. A full removal
of the JavaScript interface is a separate compatibility decision.

`sebastian-theme/markdown` exports a pure factory returning opening and closing
strings. It depends on no renderer or browser runtime. `markdown-themer` uses
that structural frame as its outermost theme; other renderers may use it too.

The opening contains one compact, linked Sebastian Software logo. The closing
contains company links and the legal copyright notice. The project authors the
intervening corpus. A family frame can be nested between company and project.
GitHub controls fonts and page styling; this Markdown export does not promise
website CSS capabilities.

The factory accepts only a copyright year or range from trusted project
configuration. Links and brand content are fixed. There is no options object or
configuration validation layer. Copyright years are never derived from the system clock.
Logo artwork remains at its existing canonical URL in `sebastian-brand`; the
factory does not fetch it during generation. Fonts and logo artwork are not
redistributed or relicensed by the package.

The planned React layouts and scoped styles are independent future exports.
They will not add browser dependencies to the Markdown entry or require its
configuration to match website composition.

## Distribution and dogfooding

Existing package consumers pin immutable Git commits until registry publication.
Native Markdown consumers may also follow a branch. The repository
commits compiled `dist/`, advertises its compiled `main`, and checks for stale
build output in CI. It has no `prepare` lifecycle. A packed consumer verifies
the public API and its composition with the actual Markdown tool.

The repository generates its own README from `README.md.src`. Standards has an
explicit ownership opt-in and continues to govern all its other files. The
README generation and standards checks both run in CI.
