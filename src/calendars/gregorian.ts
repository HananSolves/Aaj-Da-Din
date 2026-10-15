// Create the formatter once and reuse it (project-plan §5.2, performance rules).
const formatter = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

export function formatGregorian(date: Date): string {
  return formatter.format(date);
}
