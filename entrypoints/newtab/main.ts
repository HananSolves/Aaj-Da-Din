import { formatGregorian } from "../../src/calendars/gregorian.ts";

// v0 scaffold: Gregorian date only. Other calendars, festivals, photo and fact come in later steps.
const el = document.getElementById("date") as HTMLTimeElement | null;
if (el) {
  const now = new Date();
  el.textContent = formatGregorian(now);
  el.dateTime = now.toISOString().slice(0, 10);
}
