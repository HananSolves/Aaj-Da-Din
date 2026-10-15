// Festival dates read 2026-10-15. No copy of the SGPC jantri itself was read, so a physical check
// against it is still outstanding. Dekho-ji and Golden Temple Amritsar reproduce the Nanakshahi
// 558 jantri, which runs from 14 Mar 2026 to 14 Mar 2027 (jantri 557 before that), so no date
// after 14 Mar 2027 has a source yet.
//  - Dekho-ji, "Nanakshahi Calendar SGPC", one page per month, `p` counts months from January
//    2026 at 61: https://www.dekho-ji.com/calendar?t=nanakshahi&p=61
//  - Golden Temple Amritsar (SikhVerse), "Key Gurpurabs in Nanakshahi 558", attributed to the SGPC:
//    https://www.goldentempleamritsar.org/sikh-nanakshahi-calendar/2026-2027/samvat-558/calendar-2026-2027-nanakshahi-558.php
//
// Maghi is the Magh sangrand ("Sangrand (Magh) ... Jor Mela Sri Muktsar Sahib (Maghi)", p=61 and
// p=73). Basant Panchami is p=61 (23 Jan 2026) and p=74 (11 Feb 2027). Vaisakhi is p=64
// ("Sangrand (Vaisakh), Vaisakhi (Baisakhi), Khalsa Foundation Day") and Golden Temple.
//
// Not from the jantri, which does not list Lohri or Teeyan:
//  - Lohri, 13 Jan 2026: Drik Panchang lists Lohri on Tuesday 13 Jan and Makar Sankranti on 14 Jan
//    (page computed for Cambridge, MA):
//    https://www.drikpanchang.com/calendars/indian/sikh-festivals/lohri/lohri-date-time.html
//    Wikipedia gives the rule, the day before Maghi, "generally 13 or 14 January":
//    https://en.wikipedia.org/wiki/Lohri. 13 Jan 2027 follows from the sourced Maghi of 14 Jan 2027.
//  - Teeyan, 15 Aug 2026: Hariyali Teej, Sawan Shukla Tritiya, which Punjab, Haryana and Chandigarh
//    observe. Drik Panchang New Delhi times, quoted by PanchangBodh, run Tritiya from 18:46 on 14
//    Aug to 17:28 on 15 Aug, so it is the sunrise tithi on 15 Aug:
//    https://panchangbodh.com/hariyali-teej-2026. Wikipedia gives the rule, from the third day of
//    the bright half of Sawan: https://en.wikipedia.org/wiki/Teeyan
//  - Teeyan, 4 Aug 2027: Drik Panchang (page computed for Fairfield, CT, UTC-4) runs Tritiya from
//    22:49 on 3 Aug to 19:38 on 4 Aug, which is 08:19 IST on 4 Aug to 05:08 IST on 5 Aug. That lies
//    between two Amritsar sunrises, so no sunrise shows Tritiya and the festival is dated to the
//    day it begins, 4 Aug, as Drik Panchang and Dekhopanchang date it. Muhuratam gives 5 Aug.
//    https://www.drikpanchang.com/festivals/teej/hariyali-teej-date-time.html?year=2027
//    https://dekhopanchang.com/mr/festivals/hariyali-teej/2027
export const sourcedCultural: Record<string, string[]> = {
  lohri: ["2026-01-13", "2027-01-13"],
  maghi: ["2026-01-14", "2027-01-14"],
  basantPanchami: ["2026-01-23", "2027-02-11"],
  vaisakhi: ["2026-04-14"],
  teeyan: ["2026-08-15", "2027-08-04"],
};

// SGPC dates for the Sikh set, from the same two sources (Golden Temple's "Key Gurpurabs" list is
// marked "SGPC Official Nanakshahi 558 Calendar, Amritsar"). The page is Dekho-ji's `p`:
//  - Hola Mohalla, 4 Mar 2026 (p=63, "Hola Mahalla"): the day after the Phagun puranmashi (3 Mar).
//  - Khalsa Sajna Divas, 14 Apr 2026 (p=64; Golden Temple "1 Vaisakh").
//  - Shaheedi Guru Arjan Dev Ji, 18 Jun 2026 (p=66; Golden Temple "4 Har").
//  - First Prakash of Guru Granth Sahib Ji, 12 Sep 2026 (p=69; Golden Temple "27 Bhadon").
//  - Bandi Chhor Divas, 8 Nov 2026 (p=71; Golden Temple "23 Kattak"). The Masya is 9 Nov, and the
//    sunrise tithi on 9 Nov is Amavasya, so the date is listed, not derived.
//  - Gurgaddi of Guru Granth Sahib Ji, 11 Nov 2026 (p=71).
//  - Prakash of Guru Nanak Dev Ji, 24 Nov 2026 (p=71; Golden Temple "9 Magghar").
//  - Shaheedi Guru Tegh Bahadur Ji, 14 Dec 2026 (p=72; Golden Temple "29 Magghar").
//  - Prakash of Guru Gobind Singh Ji, 15 Jan 2027 (p=73; Golden Temple "2 Magh").
export const sourcedSikh: Record<string, string[]> = {
  khalsaSajnaDivas: ["2026-04-14"],
  holaMohalla: ["2026-03-04"],
  shaheediGuruArjan: ["2026-06-18"],
  prakashGuruGranthSahib: ["2026-09-12"],
  bandiChhorDivas: ["2026-11-08"],
  gurgaddiGuruGranthSahib: ["2026-11-11"],
  prakashGuruNanak: ["2026-11-24"],
  shaheediGuruTegBahadur: ["2026-12-14"],
  prakashGuruGobindSingh: ["2027-01-15"],
};

// Muslim set, umm al-Qura dates, which is what `Intl` computes and what the Hijri row shows. 2026:
// islamicprayerstimes.online/hijri-calendar, which states the "Umm al-Qura" calculation (1 Ramadan
// 18 Feb, 1 Shawwal 20 Mar, 10 Dhu al-Hijjah 27 May, 1 Muharram 16 Jun, 10 Muharram 25 Jun).
// 2027: Makkah Live, "Key Islamic dates in 1448 AH", "per the Umm al-Qura calendar of Saudi
// Arabia" (1 Ramadan 8 Feb, 1 Shawwal 9 Mar, 10 Dhu al-Hijjah 16 May, 1 Muharram 1449 6 Jun,
// 10 Muharram 15 Jun): https://makkahlive.net/en/tools/islamic-calendar. Sighting can differ by a
// day, which is why the lines say "expected". Both years list every occurrence in the year.
export const sourcedMuslim: Record<string, string[]> = {
  ramadanBegins: ["2026-02-18", "2027-02-08"],
  eidAlFitr: ["2026-03-20", "2027-03-09"],
  eidAlAdha: ["2026-05-27", "2027-05-16"],
  islamicNewYear: ["2026-06-16", "2027-06-06"],
  ashura: ["2026-06-25", "2027-06-15"],
};

// Original Nanakshahi (2003) fixed Gurpurab dates as [month, day] in the Gregorian calendar, from
// the "Festivals and events (Original Nanakshahi calendar)" table of
// https://en.wikipedia.org/wiki/Nanakshahi_calendar, which cites Pal Singh Purewal's
// purewal.biz/gurpurbs_fixed_dates.pdf (not read, so this is a secondary source):
//  - Guru Arjan martyred, 2 Harh, 16 Jun.
//  - Guru Granth Sahib installed at the Golden Temple for the first time, 17 Bhadon, 1 Sep.
//  - Guru Granth Sahib declared Guru for all times, 6 Katak, 20 Oct.
//  - Guru Tegh Bahadur martyred in Delhi, 11 Maghar, 24 Nov.
//  - Birth of Guru Gobind Singh, 23 Poh, 5 Jan.
// The same article keeps Hola Mohalla, Bandi Chhor Divas and Guru Nanak's birth movable in the 2003
// version ("kept movable as per the old Bikrami system as a compromise"), so they have no fixed
// date here. Khalsa Sajna Divas is 1 Vaisakh, 14 Apr, as in the SGPC jantri.
export const sourcedOriginalNanakshahi: Record<string, [number, number]> = {
  shaheediGuruArjan: [6, 16],
  prakashGuruGranthSahib: [9, 1],
  gurgaddiGuruGranthSahib: [10, 20],
  shaheediGuruTegBahadur: [11, 24],
  prakashGuruGobindSingh: [1, 5],
};

// Hindu set, 2026 to 2030, from Drik Panchang's monthly Hindu festival pages for New Delhi (IST),
// https://www.drikpanchang.com/festivals/month/festivals-<month>.html?year=<year>&geoname-id=1261481
// (read 2026-10-15). The sunrise tithi in the calendar data is off by a day for festivals dated by
// the midnight, afternoon or evening tithi (a probe was wrong for Maha Shivratri, Dussehra and
// Diwali in 2026 and 2027), so every date is listed and a year with no listed date shows no line.
// Where Drik lists a Smarta and an ISKCON date (Rama Navami 2026: 26 and 27 Mar; 2028: 3 and 4 Apr)
// the Smarta date is used. Holi is Rangwali Holi, the day after Holika Dahan. Drik was refusing
// requests (HTTP 403) before 2031 to 2036 could be read, and no other source covered those years, so
// they are still to be added.
export const sourcedHindu: Record<string, string[]> = {
  mahaShivratri: ["2026-02-15", "2027-03-06", "2028-02-23", "2029-02-11", "2030-03-02"],
  holi: ["2026-03-04", "2027-03-22", "2028-03-11", "2029-03-01", "2030-03-20"],
  ramNavami: ["2026-03-26", "2027-04-15", "2028-04-03", "2029-04-23", "2030-04-12"],
  rakshaBandhan: ["2026-08-28", "2027-08-17", "2028-08-05", "2029-08-23", "2030-08-13"],
  janmashtami: ["2026-09-04", "2027-08-25", "2028-08-13", "2029-09-01", "2030-08-21"],
  dussehra: ["2026-10-20", "2027-10-09", "2028-09-27", "2029-10-16", "2030-10-06"],
  karvaChauth: ["2026-10-29", "2027-10-18", "2028-10-07", "2029-10-26", "2030-10-15"],
  diwali: ["2026-11-08", "2027-10-29", "2028-10-17", "2029-11-05", "2030-10-26"],
};
