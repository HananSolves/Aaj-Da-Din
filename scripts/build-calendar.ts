// Generates data/calendar/<year>.json for 2026-2036 using astronomy-engine (dev-only).
// Sangrand days, sunrise tithis and Purnimanta months for Amritsar / IST (project-plan §4.1).
// Check the output against the SGPC jantri and a published panchang before it ships; the
// fixtures in tests/calendar-data.test.ts do this for 2026 and 2027.
import { mkdirSync, writeFileSync } from "node:fs";
import { generateYear } from "./calendar-math.ts";

const outDir = new URL("../data/calendar/", import.meta.url);
mkdirSync(outDir, { recursive: true });

for (let year = 2026; year <= 2036; year++) {
  const data = generateYear(year);
  const lines = [
    `"year":${data.year}`,
    `"sangrand":${JSON.stringify(data.sangrand)}`,
    `"tithi":${JSON.stringify(data.tithi)}`,
    `"months":${JSON.stringify(data.months)}`,
  ];
  writeFileSync(new URL(`${year}.json`, outDir), `{\n${lines.join(",\n")}\n}\n`);
  console.log(`wrote data/calendar/${year}.json`);
}
