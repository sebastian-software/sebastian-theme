# Sebastian Theme

Reusable Sebastian Software presentation components. The first release exports
data-only Markdown frames from `markdown/badges-prepend.md` and `markdown/footer.md`
for native mdtheme Git consumers. The existing `sebastian-theme/markdown`
factory remains supported; future React exports are independent. Keep the
committed badge/footer content aligned with the legacy factory; its badge stays
in `opening` for compatibility with the old JavaScript renderer.

Use Node 24+, pnpm, TypeScript ESM, and US English. Run `pnpm agent:check` before
pushing. Edit README.md.src and regenerate README.md with `pnpm readme:write`.
Brand assets remain owned by sebastian-brand. The README links to the public OSS
portal’s SVG on `main`; do not copy font files or relicense the brand identity. Use explicit copyright years, never the clock.

Compiled dist is committed for immutable Git consumers until registry releases
are available. Build and stage dist with source changes; CI detects stale output.
Do not add a prepare lifecycle: Git consumers install the compiled package.
