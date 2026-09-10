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
/** Return the deterministic Sebastian Software Markdown frame. */
export declare function sebastianTheme(options: SebastianThemeOptions): MarkdownFrame;
//# sourceMappingURL=markdown.d.ts.map