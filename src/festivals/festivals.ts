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
  {
    id: "mahaShivratri",
    set: "hindu",
    rule: {
      kind: "dates",
      dates: ["2026-02-15", "2027-03-06", "2028-02-23", "2029-02-11", "2030-03-02"],
    },
  },
  {
    id: "holi",
    set: "hindu",
    rule: {
      kind: "dates",
      dates: ["2026-03-04", "2027-03-22", "2028-03-11", "2029-03-01", "2030-03-20"],
    },
  },
  {
    id: "ramNavami",
    set: "hindu",
    rule: {
      kind: "dates",
      dates: ["2026-03-26", "2027-04-15", "2028-04-03", "2029-04-23", "2030-04-12"],
    },
  },
  {
    id: "rakshaBandhan",
    set: "hindu",
    rule: {
      kind: "dates",
      dates: ["2026-08-28", "2027-08-17", "2028-08-05", "2029-08-23", "2030-08-13"],
    },
  },
  {
    id: "janmashtami",
    set: "hindu",
    rule: {
      kind: "dates",
      dates: ["2026-09-04", "2027-08-25", "2028-08-13", "2029-09-01", "2030-08-21"],
    },
  },
  {
    id: "dussehra",
    set: "hindu",
    rule: {
      kind: "dates",
      dates: ["2026-10-20", "2027-10-09", "2028-09-27", "2029-10-16", "2030-10-06"],
    },
  },
  {
    id: "karvaChauth",
    set: "hindu",
    rule: {
      kind: "dates",
      dates: ["2026-10-29", "2027-10-18", "2028-10-07", "2029-10-26", "2030-10-15"],
    },
  },
  {
    id: "diwali",
    set: "hindu",
    rule: {
      kind: "dates",
      dates: ["2026-11-08", "2027-10-29", "2028-10-17", "2029-11-05", "2030-10-26"],
    },
  },
  { id: "khalsaSajnaDivas", set: "sikh", rule: { kind: "sangrand", month: 2 } },
  { id: "holaMohalla", set: "sikh", rule: { kind: "tithi", month: 1, paksha: "vadi", day: 1 } },
  {
    id: "shaheediGuruArjan",
    set: "sikh",
    rule: { kind: "tithi", month: 3, paksha: "sudi", day: 4 },
    original: { kind: "gregorian", month: 6, day: 16 },
  },
  {
    id: "prakashGuruGranthSahib",
    set: "sikh",
    rule: { kind: "tithi", month: 6, paksha: "sudi", day: 1 },
    original: { kind: "gregorian", month: 9, day: 1 },
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
    original: { kind: "gregorian", month: 10, day: 20 },
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
    original: { kind: "gregorian", month: 11, day: 24 },
  },
  {
    id: "prakashGuruGobindSingh",
    set: "sikh",
    rule: { kind: "tithi", month: 10, paksha: "sudi", day: 7 },
    original: { kind: "gregorian", month: 1, day: 5 },
  },
  { id: "ramadanBegins", set: "muslim", rule: { kind: "hijri", month: 9, day: 1 } },
  { id: "eidAlFitr", set: "muslim", rule: { kind: "hijri", month: 10, day: 1 } },
  { id: "eidAlAdha", set: "muslim", rule: { kind: "hijri", month: 12, day: 10 } },
  { id: "islamicNewYear", set: "muslim", rule: { kind: "hijri", month: 1, day: 1 } },
  { id: "ashura", set: "muslim", rule: { kind: "hijri", month: 1, day: 10 } },
];
