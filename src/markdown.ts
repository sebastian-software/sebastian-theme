/** The structural frame consumed by a Markdown renderer. */
export type MarkdownFrame = {
  opening: string;
  closing: string;
};

export type SebastianThemeLinks = {
  openSource: string;
  workWithUs: string;
  moreOpenSource: string;
};

export type SebastianThemeOptions = {
  copyrightYears: string;
  links?: Partial<SebastianThemeLinks>;
};

const DEFAULT_LINKS: SebastianThemeLinks = {
  openSource: "https://oss.sebastian-software.com",
  workWithUs: "https://sebastian-software.de",
  moreOpenSource: "https://oss.sebastian-software.com",
};
const LOGO_URL = "https://sebastian-brand.vercel.app/sebastian-software/logo-software.svg";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function escapeHtml(value: string): string {
  return value.replaceAll(/[&<>"']/g, (character) => {
    switch (character) {
      case "&":
        return "&amp;";
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case '"':
        return "&quot;";
      case "'":
        return "&#39;";
      default:
        return character;
    }
  });
}

function requireText(value: unknown, name: string): string {
  if (typeof value !== "string" || value.length === 0) {
    throw new TypeError(`${name} must be a non-empty string`);
  }
  return value;
}

function isNonzeroYear(value: string, offset: number): boolean {
  if (offset + 4 > value.length) return false;
  let year = "";
  for (let index = offset; index < offset + 4; index += 1) {
    const code = value.charCodeAt(index);
    if (code < 48 || code > 57) return false;
    year += value.charAt(index);
  }
  return year !== "0000";
}

function validateCopyrightYears(value: unknown): string {
  const years = requireText(value, "copyrightYears");
  const singleYear = years.length === 4 && isNonzeroYear(years, 0);
  const range =
    years.length === 9 &&
    (years[4] === "-" || years[4] === "–") &&
    isNonzeroYear(years, 0) &&
    isNonzeroYear(years, 5);
  if (!singleYear && !range) {
    throw new TypeError("copyrightYears must be a year or year range, such as 2026 or 2020-2026");
  }
  if (range && Number(years.slice(0, 4)) > Number(years.slice(5))) {
    throw new TypeError("copyrightYears must use an ascending year range");
  }
  return escapeHtml(years);
}

function validateHttpsUrl(value: unknown, name: string): string {
  if (typeof value !== "string" || value.length === 0) {
    throw new TypeError(`${name} must be an HTTPS URL`);
  }
  const input = value;
  for (const character of input) {
    if (character <= " " || character === "\u007f") {
      throw new TypeError(`${name} must be an HTTPS URL`);
    }
  }
  let url: URL;
  try {
    url = new URL(input);
  } catch {
    throw new TypeError(`${name} must be an HTTPS URL`);
  }
  if (url.protocol !== "https:" || url.username !== "" || url.password !== "") {
    throw new TypeError(`${name} must be an HTTPS URL`);
  }
  return escapeHtml(input);
}

function validateOptionObject(options: unknown): Record<string, unknown> {
  if (!isRecord(options)) throw new TypeError("options must be an object");
  for (const key of Object.keys(options)) {
    if (key !== "copyrightYears" && key !== "links") {
      throw new TypeError(`unknown theme option: ${key}`);
    }
  }
  return options;
}

function validateLinkObject(linksValue: unknown): Record<string, unknown> {
  if (linksValue === undefined) return {};
  if (!isRecord(linksValue)) throw new TypeError("links must be an object");
  for (const key of Object.keys(linksValue)) {
    if (key !== "openSource" && key !== "workWithUs" && key !== "moreOpenSource") {
      throw new TypeError(`unknown theme link: ${key}`);
    }
  }
  return linksValue;
}

function validateLink(links: Record<string, unknown>, key: keyof SebastianThemeLinks): string {
  const value = links[key] === undefined ? DEFAULT_LINKS[key] : links[key];
  return validateHttpsUrl(value, `links.${key}`);
}

function validateLinks(linksValue: unknown): SebastianThemeLinks {
  const links = validateLinkObject(linksValue);
  return {
    openSource: validateLink(links, "openSource"),
    workWithUs: validateLink(links, "workWithUs"),
    moreOpenSource: validateLink(links, "moreOpenSource"),
  };
}

function validateOptions(options: unknown): {
  copyrightYears: string;
  links: SebastianThemeLinks;
} {
  const value = validateOptionObject(options);
  return {
    copyrightYears: validateCopyrightYears(value.copyrightYears),
    links: validateLinks(value.links),
  };
}

/** Return the deterministic Sebastian Software Markdown frame. */
export function sebastianTheme(options: SebastianThemeOptions): MarkdownFrame {
  const validated = validateOptions(options);
  return {
    opening: `<p align="center">
  <a href="${validated.links.openSource}">
    <img src="${LOGO_URL}" alt="Sebastian Software" width="240" />
  </a>
</p>`,
    closing: `---

<p align="center">
  <strong>Built by Sebastian Software</strong> — consulting for TypeScript, React &amp; Rust.<br />
  <a href="${validated.links.workWithUs}">Work with us</a> · <a href="${validated.links.moreOpenSource}">More open source</a>
</p>

<p align="center">Copyright &copy; ${validated.copyrightYears} Sebastian Software GmbH</p>`,
  };
}
