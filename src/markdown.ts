/** Wrap project Markdown in the fixed Sebastian Software header and footer. */
export function sebastianTheme(copyrightYears: string) {
  return {
    opening: `<p align="center">
  <a href="https://oss.sebastian-software.com">
    <img src="https://sebastian-brand.vercel.app/sebastian-software/logo-software.svg" alt="Sebastian Software" width="240" />
  </a>
</p>`,
    closing: `---

<p align="center">
  <strong>Built by Sebastian Software</strong> — consulting for TypeScript, React &amp; Rust.<br />
  <a href="https://sebastian-software.de">Work with us</a> · <a href="https://oss.sebastian-software.com">More open source</a>
</p>

<p align="center">Copyright &copy; ${copyrightYears} Sebastian Software GmbH</p>`,
  };
}
