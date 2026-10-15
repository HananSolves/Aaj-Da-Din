export const themeIds = ["chitta", "raat", "sarson", "phulkari", "mitti", "neela"] as const;

export type ThemeId = (typeof themeIds)[number];
