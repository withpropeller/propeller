// API base URLs — swap via VITE_ env vars
export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? 'https://infrasrv.allawee.com'

export const DOCS_URL =
  import.meta.env.VITE_DOCS_URL ?? 'https://allawee-paystack-issuing-docs.apidocumentation.com'

// localStorage keys
export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'alw_access_token',
  USER_DATA: 'alw_user_data',
  BUSINESS_DATA: 'alw_business_data',
  SIDEBAR_STATE: 'alw_sidebar_state',
  MFA_SKIP: 'alw_mfa_skip',
  DASHBOARD_MODE: 'alw_dashboard_mode',
}

// Response status codes from the Infra API
export const API_STATUS = {
  SUCCESS: 'success',
  MFA_REQUIRED: 'mfa-required',
  PENDING: 'account-pending',
}

// Country list — Africa prioritised, then Americas, Europe, Asia & Middle East, Oceania
export interface Country {
  code: string
  name: string
  dialCode: string
}

export const COUNTRIES: Country[] = [
  // Africa
  { code: 'NG', name: 'Nigeria', dialCode: '+234' },
  { code: 'GH', name: 'Ghana', dialCode: '+233' },
  { code: 'KE', name: 'Kenya', dialCode: '+254' },
  { code: 'ZA', name: 'South Africa', dialCode: '+27' },
  { code: 'EG', name: 'Egypt', dialCode: '+20' },
  { code: 'ET', name: 'Ethiopia', dialCode: '+251' },
  { code: 'TZ', name: 'Tanzania', dialCode: '+255' },
  { code: 'UG', name: 'Uganda', dialCode: '+256' },
  { code: 'SN', name: 'Senegal', dialCode: '+221' },
  { code: 'CI', name: "Côte d'Ivoire", dialCode: '+225' },
  { code: 'CM', name: 'Cameroon', dialCode: '+237' },
  { code: 'RW', name: 'Rwanda', dialCode: '+250' },
  { code: 'MA', name: 'Morocco', dialCode: '+212' },
  { code: 'DZ', name: 'Algeria', dialCode: '+213' },
  { code: 'TN', name: 'Tunisia', dialCode: '+216' },
  { code: 'LY', name: 'Libya', dialCode: '+218' },
  { code: 'SD', name: 'Sudan', dialCode: '+249' },
  { code: 'SS', name: 'South Sudan', dialCode: '+211' },
  { code: 'ZM', name: 'Zambia', dialCode: '+260' },
  { code: 'ZW', name: 'Zimbabwe', dialCode: '+263' },
  { code: 'AO', name: 'Angola', dialCode: '+244' },
  { code: 'MZ', name: 'Mozambique', dialCode: '+258' },
  { code: 'MG', name: 'Madagascar', dialCode: '+261' },
  { code: 'MU', name: 'Mauritius', dialCode: '+230' },
  { code: 'BJ', name: 'Benin', dialCode: '+229' },
  { code: 'BF', name: 'Burkina Faso', dialCode: '+226' },
  { code: 'ML', name: 'Mali', dialCode: '+223' },
  { code: 'NE', name: 'Niger', dialCode: '+227' },
  { code: 'TD', name: 'Chad', dialCode: '+235' },
  { code: 'TG', name: 'Togo', dialCode: '+228' },
  { code: 'GA', name: 'Gabon', dialCode: '+241' },
  { code: 'GN', name: 'Guinea', dialCode: '+224' },
  { code: 'GW', name: 'Guinea-Bissau', dialCode: '+245' },
  { code: 'SL', name: 'Sierra Leone', dialCode: '+232' },
  { code: 'LR', name: 'Liberia', dialCode: '+231' },
  { code: 'GM', name: 'Gambia', dialCode: '+220' },
  { code: 'MR', name: 'Mauritania', dialCode: '+222' },
  { code: 'SO', name: 'Somalia', dialCode: '+252' },
  { code: 'ER', name: 'Eritrea', dialCode: '+291' },
  { code: 'DJ', name: 'Djibouti', dialCode: '+253' },
  { code: 'CF', name: 'Central African Republic', dialCode: '+236' },
  { code: 'CG', name: 'Congo', dialCode: '+242' },
  { code: 'CD', name: 'DR Congo', dialCode: '+243' },
  { code: 'GQ', name: 'Equatorial Guinea', dialCode: '+240' },
  { code: 'ST', name: 'São Tomé and Príncipe', dialCode: '+239' },
  { code: 'CV', name: 'Cape Verde', dialCode: '+238' },
  { code: 'SC', name: 'Seychelles', dialCode: '+248' },
  { code: 'KM', name: 'Comoros', dialCode: '+269' },
  { code: 'BI', name: 'Burundi', dialCode: '+257' },
  { code: 'MW', name: 'Malawi', dialCode: '+265' },
  { code: 'LS', name: 'Lesotho', dialCode: '+266' },
  { code: 'SZ', name: 'Eswatini', dialCode: '+268' },
  { code: 'BW', name: 'Botswana', dialCode: '+267' },
  { code: 'NA', name: 'Namibia', dialCode: '+264' },
  // Americas
  { code: 'US', name: 'United States', dialCode: '+1' },
  { code: 'CA', name: 'Canada', dialCode: '+1' },
  { code: 'BR', name: 'Brazil', dialCode: '+55' },
  { code: 'MX', name: 'Mexico', dialCode: '+52' },
  { code: 'AR', name: 'Argentina', dialCode: '+54' },
  { code: 'CO', name: 'Colombia', dialCode: '+57' },
  { code: 'CL', name: 'Chile', dialCode: '+56' },
  { code: 'PE', name: 'Peru', dialCode: '+51' },
  { code: 'VE', name: 'Venezuela', dialCode: '+58' },
  { code: 'EC', name: 'Ecuador', dialCode: '+593' },
  { code: 'BO', name: 'Bolivia', dialCode: '+591' },
  { code: 'PY', name: 'Paraguay', dialCode: '+595' },
  { code: 'UY', name: 'Uruguay', dialCode: '+598' },
  // Europe
  { code: 'GB', name: 'United Kingdom', dialCode: '+44' },
  { code: 'DE', name: 'Germany', dialCode: '+49' },
  { code: 'FR', name: 'France', dialCode: '+33' },
  { code: 'IT', name: 'Italy', dialCode: '+39' },
  { code: 'ES', name: 'Spain', dialCode: '+34' },
  { code: 'NL', name: 'Netherlands', dialCode: '+31' },
  { code: 'BE', name: 'Belgium', dialCode: '+32' },
  { code: 'CH', name: 'Switzerland', dialCode: '+41' },
  { code: 'SE', name: 'Sweden', dialCode: '+46' },
  { code: 'NO', name: 'Norway', dialCode: '+47' },
  { code: 'DK', name: 'Denmark', dialCode: '+45' },
  { code: 'FI', name: 'Finland', dialCode: '+358' },
  { code: 'PT', name: 'Portugal', dialCode: '+351' },
  { code: 'IE', name: 'Ireland', dialCode: '+353' },
  { code: 'AT', name: 'Austria', dialCode: '+43' },
  { code: 'PL', name: 'Poland', dialCode: '+48' },
  // Asia & Middle East
  { code: 'AE', name: 'United Arab Emirates', dialCode: '+971' },
  { code: 'SA', name: 'Saudi Arabia', dialCode: '+966' },
  { code: 'QA', name: 'Qatar', dialCode: '+974' },
  { code: 'KW', name: 'Kuwait', dialCode: '+965' },
  { code: 'BH', name: 'Bahrain', dialCode: '+973' },
  { code: 'OM', name: 'Oman', dialCode: '+968' },
  { code: 'JO', name: 'Jordan', dialCode: '+962' },
  { code: 'LB', name: 'Lebanon', dialCode: '+961' },
  { code: 'IL', name: 'Israel', dialCode: '+972' },
  { code: 'IN', name: 'India', dialCode: '+91' },
  { code: 'CN', name: 'China', dialCode: '+86' },
  { code: 'JP', name: 'Japan', dialCode: '+81' },
  { code: 'KR', name: 'South Korea', dialCode: '+82' },
  { code: 'SG', name: 'Singapore', dialCode: '+65' },
  { code: 'MY', name: 'Malaysia', dialCode: '+60' },
  { code: 'TH', name: 'Thailand', dialCode: '+66' },
  { code: 'ID', name: 'Indonesia', dialCode: '+62' },
  { code: 'PH', name: 'Philippines', dialCode: '+63' },
  { code: 'VN', name: 'Vietnam', dialCode: '+84' },
  { code: 'PK', name: 'Pakistan', dialCode: '+92' },
  { code: 'BD', name: 'Bangladesh', dialCode: '+880' },
  { code: 'TR', name: 'Turkey', dialCode: '+90' },
  // Oceania
  { code: 'AU', name: 'Australia', dialCode: '+61' },
  { code: 'NZ', name: 'New Zealand', dialCode: '+64' },
]
