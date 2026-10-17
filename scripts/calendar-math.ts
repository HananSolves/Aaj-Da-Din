import * as Astronomy from "astronomy-engine";

/** The place a calendar's published almanac is computed for (project-plan §3.4.6). */
export type Place = {
  name: string;
  latitude: number;
  longitude: number;
  /** Metres above sea level. */
  elevation: number;
  /** Local civil time of the place, in minutes ahead of UTC. */
  utcOffsetMinutes: number;
};

export type SolarYear = {
  year: number;
  /** 13 sorted ISO dates; index 0 is the previous December's sangrand. */
  sangrand: string[];
};

export type LunisolarYear = {
  year: number;
  /** Sunrise tithi, 1 to 30, one per day of the year. */
  tithi: number[];
  months: [date: string, monthIndex: number, adhik: 0 | 1][];
};

export type Sankranti = { rashi: number; time: Date };

const DAY_MS = 86_400_000;

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

function localDate(date: Date, place: Place): string {
  return new Date(date.getTime() + place.utcOffsetMinutes * 60_000).toISOString().slice(0, 10);
}

function addDays(iso: string, days: number): string {
  return new Date(Date.parse(`${iso}T00:00:00Z`) + days * DAY_MS).toISOString().slice(0, 10);
}

function sunrise(iso: string, place: Place): Date {
  const key = `${place.name}|${iso}`;
  const cached = sunriseCache.get(key);
  if (cached) return cached;
  const observer = new Astronomy.Observer(place.latitude, place.longitude, place.elevation);
  const midnight = new Date(Date.parse(`${iso}T00:00:00Z`) - place.utcOffsetMinutes * 60_000);
  const found = Astronomy.SearchRiseSet(Astronomy.Body.Sun, observer, +1, midnight, 1);
  if (!found) throw new Error(`no sunrise found for ${iso} at ${place.name}`);
  sunriseCache.set(key, found.date);
  return found.date;
}

// The sunrise-to-sunrise day that contains the instant. This is the rule the SGPC-style
// sangrand fixtures agree on (a sankranti between midnight and sunrise belongs to the day before).
function dayContaining(instant: Date, place: Place): string {
  const day = localDate(instant, place);
  return instant < sunrise(day, place) ? addDays(day, -1) : day;
}

function firstSunriseAtOrAfter(instant: Date, place: Place): string {
  const day = localDate(instant, place);
  return sunrise(day, place) >= instant ? day : addDays(day, 1);
}

function tithiAtSunrise(iso: string, place: Place): number {
  const key = `${place.name}|${iso}`;
  const cached = tithiCache.get(key);
  if (cached) return cached;
  const tithi = Math.floor(Astronomy.MoonPhase(sunrise(iso, place)) / 12) + 1;
  tithiCache.set(key, tithi);
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
function purnimantaEntries(year: number, place: Place): Entry[] {
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
    const startDay = firstSunriseAtOrAfter(previousAdhik ? start : fullBefore, place);
    entries.push({ start: startDay, month, adhik: 0 });
    if (adhik) entries.push({ start: firstSunriseAtOrAfter(start, place), month, adhik: 1 });
    previousAdhik = adhik;
  }
  return entries;
}

/** Sangrand days: each sankranti belongs to the sunrise-to-sunrise day that contains it. */
export function generateSolarYear(year: number, place: Place): SolarYear {
  const jan1 = `${year}-01-01`;
  const sankrantis = findSankrantis(
    new Date(Date.UTC(year - 1, 10, 1)),
    new Date(Date.UTC(year + 1, 0, 15)),
  );
  const sangrandDays = sankrantis.map((s) => dayContaining(s.time, place));
  const inYear = sangrandDays.filter((d) => d.startsWith(`${year}-`));
  const carried = sangrandDays.filter((d) => d < jan1).at(-1);
  if (inYear.length !== 12 || !carried) {
    throw new Error(`${year}: expected 12 sangrands plus a carried one, got ${inYear.length}`);
  }
  return { year, sangrand: [carried, ...inYear] };
}

/** Sunrise tithis and Purnimanta months. */
export function generateLunisolarYear(year: number, place: Place): LunisolarYear {
  const jan1 = `${year}-01-01`;
  const days = Date.UTC(year + 1, 0, 1) / DAY_MS - Date.UTC(year, 0, 1) / DAY_MS;
  const tithi = Array.from({ length: days }, (_, i) => tithiAtSunrise(addDays(jan1, i), place));

  const all = purnimantaEntries(year, place);
  const carriedMonth = all.filter((e) => e.start <= jan1).at(-1);
  const inYearMonths = all.filter((e) => e.start > jan1 && e.start.startsWith(`${year}-`));
  if (!carriedMonth) throw new Error(`${year}: no month in progress on 1 January`);
  const months = [carriedMonth, ...inYearMonths].map((e): [string, number, 0 | 1] => [
    e.start,
    e.month,
    e.adhik,
  ]);

  return { year, tithi, months };
}
