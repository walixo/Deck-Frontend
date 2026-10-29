/**
 * Africa's 54 countries, as ISO 3166-1 alpha-2 codes.
 *
 * The import pilot lists African products first, so the staff form offers these
 * at the top of its country picker. Codes only — names come from the browser's
 * `Intl.DisplayNames`, so they read in the reader's language and need no table
 * of translations here.
 */
export const AFRICAN_COUNTRIES = [
  'DZ',
  'AO',
  'BJ',
  'BW',
  'BF',
  'BI',
  'CV',
  'CM',
  'CF',
  'TD',
  'KM',
  'CG',
  'CD',
  'CI',
  'DJ',
  'EG',
  'GQ',
  'ER',
  'SZ',
  'ET',
  'GA',
  'GM',
  'GH',
  'GN',
  'GW',
  'KE',
  'LS',
  'LR',
  'LY',
  'MG',
  'MW',
  'ML',
  'MR',
  'MU',
  'MA',
  'MZ',
  'NA',
  'NE',
  'NG',
  'RW',
  'ST',
  'SN',
  'SC',
  'SL',
  'SO',
  'ZA',
  'SS',
  'SD',
  'TZ',
  'TG',
  'TN',
  'UG',
  'ZM',
  'ZW',
] as const;

/** "Nigeria" for "NG", in the reader's language; the code itself if the browser cannot say. */
export function countryName(code: string): string {
  try {
    return new Intl.DisplayNames(undefined, { type: 'region' }).of(code) ?? code;
  } catch {
    return code;
  }
}
