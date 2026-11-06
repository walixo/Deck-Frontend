/**
 * Countries for Match's "where are you?", named in English by the browser
 * itself (Intl.DisplayNames), so the list costs only the codes.
 *
 * Nothing about where someone is leaves their phone except the country they
 * pick. The guess that pre-fills it comes from the phone's time zone and
 * language settings — no location permission, no GPS.
 */

/* ISO 3166-1 alpha-2, the countries and territories people might be in. */
const CODES =
  'AD AE AF AG AI AL AM AO AR AS AT AU AW AZ BA BB BD BE BF BG BH BI BJ BM BN BO BR BS BT BW BY BZ CA CD CF CG CH CI CK CL CM CN CO CR CU CV CW CY CZ DE DJ DK DM DO DZ EC EE EG ER ES ET FI FJ FM FR GA GB GD GE GH GI GM GN GQ GR GT GU GW GY HK HN HR HT HU ID IE IL IN IQ IR IS IT JM JO JP KE KG KH KI KM KN KR KW KY KZ LA LB LC LI LK LR LS LT LU LV LY MA MC MD ME MG MH MK ML MM MN MO MR MS MT MU MV MW MX MY MZ NA NE NG NI NL NO NP NR NZ OM PA PE PG PH PK PL PR PS PT PW PY QA RO RS RU RW SA SB SC SD SE SG SI SK SL SM SN SO SR SS ST SV SX SY SZ TC TD TG TH TJ TL TM TN TO TR TT TV TW TZ UA UG US UY UZ VC VE VG VI VN VU WS YE ZA ZM ZW'.split(
    ' ',
  );

/* Where most Match people are: listed first. */
const FIRST = ['NG', 'GH', 'KE', 'ZA', 'GB', 'US', 'CA'];

/* Time zones that settle the country on their own. */
const ZONES: Record<string, string> = {
  'Africa/Lagos': 'NG',
  'Africa/Accra': 'GH',
  'Africa/Nairobi': 'KE',
  'Africa/Johannesburg': 'ZA',
  'Africa/Cairo': 'EG',
  'Africa/Kampala': 'UG',
  'Africa/Dar_es_Salaam': 'TZ',
  'Africa/Kigali': 'RW',
  'Africa/Addis_Ababa': 'ET',
  'Africa/Casablanca': 'MA',
  'Africa/Abidjan': 'CI',
  'Africa/Dakar': 'SN',
  'Africa/Douala': 'CM',
  'Africa/Lusaka': 'ZM',
  'Africa/Harare': 'ZW',
  'Europe/London': 'GB',
  'Europe/Dublin': 'IE',
  'America/Toronto': 'CA',
  'America/Vancouver': 'CA',
};

const names = (() => {
  try {
    return new Intl.DisplayNames(['en'], { type: 'region' });
  } catch {
    return null;
  }
})();

export const countryName = (code: string) => (code && names?.of(code)) || code;

/** Every country as `{ code, name }`: the common ones first, then A to Z. */
export const COUNTRIES = [
  ...FIRST.map((code) => ({ code, name: countryName(code) })),
  ...CODES.filter((code) => !FIRST.includes(code))
    .map((code) => ({ code, name: countryName(code) }))
    .sort((a, b) => a.name.localeCompare(b.name)),
];

/** A best guess at where this phone is, from its settings; empty if unsure. */
export function guessCountry(): string {
  try {
    const zone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (ZONES[zone]) return ZONES[zone];
  } catch {
    /* No time zone: try the language. */
  }
  for (const language of navigator.languages ?? [navigator.language]) {
    const region = language.split('-')[1]?.toUpperCase();
    if (region && CODES.includes(region)) return region;
  }
  return '';
}
