// Generates data/calendar/<calendar>/<year>.json for 2026-2036 using astronomy-engine (dev-only).
// Each calendar in scripts/calendars.ts is computed for its own reference place (project-plan
// §3.4.6). Check the output against the calendar's published almanac before it ships; the fixtures
// in tests/calendar-data.test.ts do this for the Punjabi calendars (SGPC jantri, Drik Panchang).
//
// `--check` writes nothing and exits 1 if a committed file differs from the generator output.
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dataCalendars, firstYear, lastYear } from "./calendars.ts";

const outDir = new URL("../data/calendar/", import.meta.url);
const check = process.argv.includes("--check");
let drifted = false;

for (const { id, place, generate } of dataCalendars) {
  if (!check) mkdirSync(new URL(`${id}/`, outDir), { recursive: true });

  for (let year = firstYear; year <= lastYear; year++) {
    const lines = Object.entries(generate(year, place)).map(
      ([key, value]) => `${JSON.stringify(key)}:${JSON.stringify(value)}`,
    );
    const text = `{\n${lines.join(",\n")}\n}\n`;
    const path = `${id}/${year}.json`;
    const file = new URL(path, outDir);

    if (check) {
      let current: string | undefined;
      try {
        current = readFileSync(file, "utf8");
      } catch {}
      if (current !== text) {
        drifted = true;
        console.log(`DRIFT data/calendar/${path} differs from the generator output`);
      }
    } else {
      writeFileSync(file, text);
      console.log(`wrote data/calendar/${path}`);
    }
  }
}

if (check) {
  console.log(
    drifted ? "Run pnpm build:calendar and review the diff." : "calendar data is in sync",
  );
  process.exit(drifted ? 1 : 0);
}
