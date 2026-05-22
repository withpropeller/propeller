/** ISO 3166-1 alpha-2 codes eligible for self-serve merchant signup (China–Africa corridor exporters). */
export const SELF_SERVE_MERCHANT_COUNTRY_CODES = [
    'CN',
    'HK',
    'MO',
    'SG',
    'TW',
    'US',
    'GB',
    'DE',
    'FR',
    'NL',
    'IT',
    'ES',
    'CH',
    'BE',
    'CA',
    'AE',
    'IN',
    'KR',
    'JP',
    'AU',
] as const;

export function isSelfServeMerchantCountry(countryCode: string): boolean {
    return (SELF_SERVE_MERCHANT_COUNTRY_CODES as readonly string[]).includes(countryCode);
}
