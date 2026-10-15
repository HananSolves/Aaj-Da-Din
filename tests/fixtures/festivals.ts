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
