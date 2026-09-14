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

---

<!-- sebastian-software-consumer-agents:start -->

# Standards-managed repo guardrails

- Do not hand-edit managed files or standards-owned marker sections.
- If `standards check` reports drift, run `standards apply` or update standards.
- The repository's own gate may omit `standards check`; CI can still fail on it.

Node repositories:

- Fix or format every file reported by `oxfmt` whenever practical.
- For generated files, prefer formatting in the generator step.
- If formatting is not viable, use repo-local `.prettierignore`.
- Never add repo-specific ignores to managed `.oxfmtrc.json`.

Rust repositories:

- Keep `cargo fmt --all --check` and
  `cargo clippy --workspace --all-targets --all-features -- -D warnings` green.
- Lint levels belong in `[workspace.lints]`, never in managed `rustfmt.toml`.
- `rust-version` in `Cargo.toml` is the only MSRV; every other mention is a
  derived copy.
- Record a cargo-deny finding as a narrow, commented exception in `deny.toml` —
  never by widening the org allow-list.

<!-- sebastian-software-consumer-agents:end -->
