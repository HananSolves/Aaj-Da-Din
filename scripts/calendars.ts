import type { DataCalendarId } from "../src/calendars/year-data.ts";
import {
  generateLunisolarYear,
  generateSolarYear,
  type LunisolarYear,
  type Place,
  type SolarYear,
} from "./calendar-math.ts";

export const amritsar: Place = {
  name: "Amritsar",
  latitude: 31.634,
  longitude: 74.8723,
  elevation: 234,
  utcOffsetMinutes: 330,
};

export interface DataCalendar {
  id: DataCalendarId;
  place: Place;
  generate: (year: number, place: Place) => SolarYear | LunisolarYear;
}

/** Every calendar that ships generated data. Add a calendar here with its reference place. */
export const dataCalendars: readonly DataCalendar[] = [
  { id: "punjabi-solar", place: amritsar, generate: generateSolarYear },
  { id: "bikrami", place: amritsar, generate: generateLunisolarYear },
];

export const firstYear = 2026;
export const lastYear = 2036;
