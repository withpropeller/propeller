export const MONGO_UNIQUE_CONSTRAINT_CODE = 11000;
export const DUPLICATE_UNIQUE_CONSTRAINT_CODE = '23505';
export const COLUMN_NULL_VALUE = 'NULL_VALUE';

/**
 * Currency symbol map used by Utils.parseMinorToCurrency / parseFloatToCurrency.
 * Extend per-environment if more currencies are needed.
 */
export const CURRENCY_SYMBOLS: Record<string, string> = {
  NGN: '₦',
  USD: '$',
  USDC: 'USDC ',
  USDT: 'USDT ',
  EUR: '€',
  GBP: '£',
};
