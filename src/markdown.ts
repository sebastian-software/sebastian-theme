/** Wrap project Markdown in the fixed Sebastian Software header and footer. */
export function sebastianTheme(copyrightYears: string) {
  return {
    opening: `[![Powered by Sebastian Software](https://img.shields.io/badge/Powered_by-Sebastian_Software-005164?style=flat)](https://oss.sebastian-software.com)`,
    closing: `---

<p align="center">
  <a href="https://oss.sebastian-software.com"><img src="https://raw.githubusercontent.com/sebastian-software/oss.sebastian-software.com/main/app/assets/logo-software.svg" alt="Sebastian Software" width="160" /></a><br />
  TypeScript, React &amp; Rust consulting<br />
  Experts in Agentic Software Development<br />
  <a href="https://sebastian-software.de">Work with us</a> · <a href="https://oss.sebastian-software.com">More open source</a>
</p>

<p align="center">Copyright &copy; ${copyrightYears} Sebastian Software GmbH</p>`,
  };
}
