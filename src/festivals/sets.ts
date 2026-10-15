// Ids only, so the settings validator can import them without pulling in the festival data.
export const festivalSets = ["cultural", "hindu", "sikh", "muslim"] as const;
export type FestivalSet = (typeof festivalSets)[number];

export const gurpurabSources = ["sgpc", "nanakshahi"] as const;
export type GurpurabSource = (typeof gurpurabSources)[number];
