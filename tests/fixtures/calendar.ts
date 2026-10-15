// Secondary reproductions of the SGPC calendar, read 2026-10-15. No copy of the SGPC jantri
// itself was available, so a physical check against it is still outstanding.
//  - Punjab Data, Nanakshahi Calendar 2026 (sangrand, puranmashi and masya tables,
//    "followed by SGPC"): https://www.punjabdata.com/Nanakshahi-Calendar-2026-Punjabi-Jantri.aspx
//  - Dekho-ji sangrand list 2026 and 2027: https://www.dekho-ji.com/calendar?t=sangrand
//  - Golden Temple Amritsar (SikhVerse), Nanakshahi 558 month starts, cites the SGPC calendar:
//    https://www.goldentempleamritsar.org/sikh-nanakshahi-calendar/2026-2027/samvat-558/calendar-2026-2027-nanakshahi-558.php
export const sangrand2026 = [
  "2026-01-14",
  "2026-02-12",
  "2026-03-14",
  "2026-04-14",
  "2026-05-15",
  "2026-06-15",
  "2026-07-16",
  "2026-08-17",
  "2026-09-17",
  "2026-10-17",
  "2026-11-16",
  "2026-12-16",
];
export const sangrand2027First3 = ["2027-01-14", "2027-02-13", "2027-03-15"];

// Punjab Data puranmashi and masya tables for 2026 (the adhik Jeth puranmashi is 31 May).
export const puranmashi2026 = [
  "2026-01-03",
  "2026-02-01",
  "2026-03-03",
  "2026-04-02",
  "2026-05-01",
  "2026-05-31",
  "2026-06-29",
  "2026-07-29",
  "2026-08-28",
  "2026-09-26",
  "2026-10-26",
  "2026-11-24",
  "2026-12-23",
];
export const masya2026 = [
  "2026-01-18",
  "2026-02-17",
  "2026-03-19",
  "2026-04-17",
  "2026-05-16",
  "2026-06-15",
  "2026-07-14",
  "2026-08-12",
  "2026-09-11",
  "2026-10-10",
  "2026-11-09",
  "2026-12-08",
];

// Purnimanta month starts after the Jan 2026 carry-over: each begins the day after the puranmashi
// above, and adhik Jeth runs 17 May to 15 June (Punjab Data). [start, month (0 = Chaitra), adhik]
export const purnimantaMonths2026: [string, number, 0 | 1][] = [
  ["2026-01-04", 10, 0],
  ["2026-02-02", 11, 0],
  ["2026-03-04", 0, 0],
  ["2026-04-03", 1, 0],
  ["2026-05-02", 2, 0],
  ["2026-05-17", 2, 1],
  ["2026-06-16", 2, 0],
  ["2026-06-30", 3, 0],
  ["2026-07-30", 4, 0],
  ["2026-08-29", 5, 0],
  ["2026-09-27", 6, 0],
  ["2026-10-27", 7, 0],
  ["2026-11-25", 8, 0],
  ["2026-12-24", 9, 0],
];
