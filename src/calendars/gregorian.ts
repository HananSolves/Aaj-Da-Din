// Create the formatter once and reuse it (PLAN §9, performance rules).
const formatter = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

export function formatGregorian(date: Date): string {
  return formatter.format(date);
}
