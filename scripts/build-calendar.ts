// Generates data/calendar/<year>.json for 2026-2036 using astronomy-engine (dev-only).
// Sangrand days, sunrise tithis and Purnimanta months for Amritsar / IST (project-plan §4.1).
// Check the output against the SGPC jantri and a published panchang before it ships; the
// fixtures in tests/calendar-data.test.ts do this for 2026 and 2027.
//
// `--check` writes nothing and exits 1 if a committed file differs from the generator output.
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { generateYear } from "./calendar-math.ts";

const outDir = new URL("../data/calendar/", import.meta.url);
const check = process.argv.includes("--check");
let drifted = false;

if (!check) mkdirSync(outDir, { recursive: true });

for (let year = 2026; year <= 2036; year++) {
  const data = generateYear(year);
  const lines = [
    `"year":${data.year}`,
    `"sangrand":${JSON.stringify(data.sangrand)}`,
    `"tithi":${JSON.stringify(data.tithi)}`,
    `"months":${JSON.stringify(data.months)}`,
  ];
  const text = `{\n${lines.join(",\n")}\n}\n`;
  const file = new URL(`${year}.json`, outDir);

  if (check) {
    let current: string | undefined;
    try {
      current = readFileSync(file, "utf8");
    } catch {}
    if (current !== text) {
      drifted = true;
      console.log(`DRIFT data/calendar/${year}.json differs from the generator output`);
    }
  } else {
    writeFileSync(file, text);
    console.log(`wrote data/calendar/${year}.json`);
  }
}

if (check) {
  console.log(
    drifted ? "Run pnpm build:calendar and review the diff." : "calendar data is in sync",
  );
  process.exit(drifted ? 1 : 0);
}
