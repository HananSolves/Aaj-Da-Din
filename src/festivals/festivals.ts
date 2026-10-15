import type { Festival } from "./rules.ts";

export const festivals: Festival[] = [
  { id: "lohri", set: "cultural", rule: { kind: "sangrand", month: 11, daysBefore: 1 } },
  { id: "maghi", set: "cultural", rule: { kind: "sangrand", month: 11 } },
  {
    id: "basantPanchami",
    set: "cultural",
    rule: { kind: "tithi", month: 11, paksha: "sudi", day: 5 },
  },
  { id: "vaisakhi", set: "cultural", rule: { kind: "sangrand", month: 2 } },
  { id: "teeyan", set: "cultural", rule: { kind: "tithi", month: 5, paksha: "sudi", day: 3 } },
  { id: "khalsaSajnaDivas", set: "sikh", rule: { kind: "sangrand", month: 2 } },
  { id: "holaMohalla", set: "sikh", rule: { kind: "tithi", month: 1, paksha: "vadi", day: 1 } },
  {
    id: "shaheediGuruArjan",
    set: "sikh",
    rule: { kind: "tithi", month: 3, paksha: "sudi", day: 4 },
  },
  {
    id: "prakashGuruGranthSahib",
    set: "sikh",
    rule: { kind: "tithi", month: 6, paksha: "sudi", day: 1 },
  },
  {
    id: "bandiChhorDivas",
    set: "sikh",
    rule: { kind: "dates", dates: ["2026-11-08"] },
  },
  {
    id: "gurgaddiGuruGranthSahib",
    set: "sikh",
    rule: { kind: "tithi", month: 8, paksha: "sudi", day: 2 },
  },
  {
    id: "prakashGuruNanak",
    set: "sikh",
    rule: { kind: "tithi", month: 8, paksha: "sudi", day: 15 },
  },
  {
    id: "shaheediGuruTegBahadur",
    set: "sikh",
    rule: { kind: "tithi", month: 9, paksha: "sudi", day: 5 },
  },
  {
    id: "prakashGuruGobindSingh",
    set: "sikh",
    rule: { kind: "tithi", month: 10, paksha: "sudi", day: 7 },
  },
];
