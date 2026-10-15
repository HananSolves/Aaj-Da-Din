import * as Astronomy from "astronomy-engine";

export type YearData = {
  year: number;
  sangrand: string[];
  tithi: number[];
  months: [date: string, monthIndex: number, adhik: 0 | 1][];
};

export type Sankranti = { rashi: number; time: Date };

const IST_OFFSET_MS = 5.5 * 3600_000;
const DAY_MS = 86_400_000;
const amritsar = new Astronomy.Observer(31.634, 74.8723, 234);

const sunriseCache = new Map<string, Date>();
const tithiCache = new Map<string, number>();

function wrap(deg: number, lo: number): number {
  return ((((deg - lo) % 360) + 360) % 360) + lo;
}

// Lahiri ayanamsa plus general precession in longitude. The textbook J2000 value (23.8531) put
// every sankranti about 14 minutes earlier than Drik Panchang's published table, so the zero
// point is fitted to that table (24 values, 2026-2027, all within one minute afterwards).
const AYANAMSA_J2000 = 23.862746;

function lahiriAyanamsa(time: Astronomy.AstroTime): number {
  const t = time.tt / 36525;
  return AYANAMSA_J2000 + (5028.796195 * t + 1.1054348 * t * t) / 3600;
}

function siderealSunLongitude(time: Astronomy.AstroTime): number {
  return wrap(Astronomy.SunPosition(time).elon - lahiriAyanamsa(time), 0);
}

function istDate(date: Date): string {
  return new Date(date.getTime() + IST_OFFSET_MS).toISOString().slice(0, 10);
}

function addDays(iso: string, days: number): string {
  return new Date(Date.parse(`${iso}T00:00:00Z`) + days * DAY_MS).toISOString().slice(0, 10);
}

function sunrise(iso: string): Date {
  const cached = sunriseCache.get(iso);
  if (cached) return cached;
  const istMidnight = new Date(Date.parse(`${iso}T00:00:00Z`) - IST_OFFSET_MS);
  const found = Astronomy.SearchRiseSet(Astronomy.Body.Sun, amritsar, +1, istMidnight, 1);
  if (!found) throw new Error(`no sunrise found for ${iso}`);
  sunriseCache.set(iso, found.date);
  return found.date;
}

// The sunrise-to-sunrise day that contains the instant. This is the rule the SGPC-style
// sangrand fixtures agree on (a sankranti between midnight and sunrise belongs to the day before).
function dayContaining(instant: Date): string {
  const day = istDate(instant);
  return instant < sunrise(day) ? addDays(day, -1) : day;
}

function firstSunriseAtOrAfter(instant: Date): string {
  const day = istDate(instant);
  return sunrise(day) >= instant ? day : addDays(day, 1);
}

export function tithiAtSunrise(iso: string): number {
  const cached = tithiCache.get(iso);
  if (cached) return cached;
  const tithi = Math.floor(Astronomy.MoonPhase(sunrise(iso)) / 12) + 1;
  tithiCache.set(iso, tithi);
  return tithi;
}

export function findSankrantis(from: Date, to: Date): Sankranti[] {
  const found: Sankranti[] = [];
  let prev = from;
  let prevSign = Math.floor(siderealSunLongitude(Astronomy.MakeTime(prev)) / 30);
  for (let ms = from.getTime() + DAY_MS; ms <= to.getTime(); ms += DAY_MS) {
    const next = new Date(ms);
    const sign = Math.floor(siderealSunLongitude(Astronomy.MakeTime(next)) / 30);
    if (sign !== prevSign) {
      const target = sign * 30;
      const time = Astronomy.Search(
        (t) => wrap(siderealSunLongitude(t) - target, -180),
        Astronomy.MakeTime(prev),
        Astronomy.MakeTime(next),
        { dt_tolerance_seconds: 1 },
      );
      if (!time) throw new Error("sankranti search failed");
      found.push({ rashi: sign, time: time.date });
    }
    prev = next;
    prevSign = sign;
  }
  return found;
}

function moonPhaseTimes(phase: 0 | 180, from: Date, to: Date): Date[] {
  const times: Date[] = [];
  let cursor = from;
  while (cursor < to) {
    const found = Astronomy.SearchMoonPhase(phase, cursor, 40);
    if (!found || found.date >= to) break;
    times.push(found.date);
    cursor = new Date(found.date.getTime() + DAY_MS);
  }
  return times;
}

type Entry = { start: string; month: number; adhik: 0 | 1 };

// Chaitra = 0. A lunar month takes the name after the sign the sun is in at its new moon.
// A month with no sankranti inside it is adhik. Months run Purnimanta (full moon to full moon),
// except that an adhik month and the nija month after it keep their new moon boundaries, as the
// published jantri shows (Adhik Jeth 2026 runs 17 May to 15 June).
function purnimantaEntries(year: number): Entry[] {
  const from = new Date(Date.UTC(year - 1, 9, 1));
  const to = new Date(Date.UTC(year + 1, 1, 15));
  const newMoons = moonPhaseTimes(0, from, to);
  const fullMoons = moonPhaseTimes(180, from, to);
  const rashiAt = (d: Date) => Math.floor(siderealSunLongitude(Astronomy.MakeTime(d)) / 30);

  const entries: Entry[] = [];
  let previousAdhik = false;
  for (let j = 1; j + 1 < newMoons.length; j++) {
    const start = newMoons[j];
    const end = newMoons[j + 1];
    if (!start || !end) continue;
    const adhik = rashiAt(start) === rashiAt(end);
    const month = (rashiAt(start) + 1) % 12;
    const fullBefore = fullMoons.filter((f) => f < start).at(-1);
    if (!fullBefore) continue;
    const startDay = firstSunriseAtOrAfter(previousAdhik ? start : fullBefore);
    entries.push({ start: startDay, month, adhik: 0 });
    if (adhik) entries.push({ start: firstSunriseAtOrAfter(start), month, adhik: 1 });
    previousAdhik = adhik;
  }
  return entries;
}

export function generateYear(year: number): YearData {
  const jan1 = `${year}-01-01`;
  const days = Date.UTC(year + 1, 0, 1) / DAY_MS - Date.UTC(year, 0, 1) / DAY_MS;

  const sankrantis = findSankrantis(
    new Date(Date.UTC(year - 1, 10, 1)),
    new Date(Date.UTC(year + 1, 0, 15)),
  );
  const sangrandDays = sankrantis.map((s) => dayContaining(s.time));
  const inYear = sangrandDays.filter((d) => d.startsWith(`${year}-`));
  const carried = sangrandDays.filter((d) => d < jan1).at(-1);
  if (inYear.length !== 12 || !carried) {
    throw new Error(`${year}: expected 12 sangrands plus a carried one, got ${inYear.length}`);
  }

  const tithi = Array.from({ length: days }, (_, i) => tithiAtSunrise(addDays(jan1, i)));

  const all = purnimantaEntries(year);
  const carriedMonth = all.filter((e) => e.start <= jan1).at(-1);
  const inYearMonths = all.filter((e) => e.start > jan1 && e.start.startsWith(`${year}-`));
  if (!carriedMonth) throw new Error(`${year}: no month in progress on 1 January`);
  const months = [carriedMonth, ...inYearMonths].map((e): [string, number, 0 | 1] => [
    e.start,
    e.month,
    e.adhik,
  ]);

  return { year, sangrand: [carried, ...inYear], tithi, months };
}
