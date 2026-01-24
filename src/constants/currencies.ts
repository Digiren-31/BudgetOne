// Currency configurations
export interface Currency {
  code: string;
  symbol: string;
  name: string;
  locale: string;
  decimalPlaces: number;
}

export const CURRENCIES: Currency[] = [
  { code: 'INR', symbol: '₹', name: 'Indian Rupee', locale: 'en-IN', decimalPlaces: 2 },
  { code: 'USD', symbol: '$', name: 'US Dollar', locale: 'en-US', decimalPlaces: 2 },
  { code: 'EUR', symbol: '€', name: 'Euro', locale: 'de-DE', decimalPlaces: 2 },
  { code: 'GBP', symbol: '£', name: 'British Pound', locale: 'en-GB', decimalPlaces: 2 },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen', locale: 'ja-JP', decimalPlaces: 0 },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar', locale: 'en-AU', decimalPlaces: 2 },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar', locale: 'en-CA', decimalPlaces: 2 },
  { code: 'CHF', symbol: 'CHF', name: 'Swiss Franc', locale: 'de-CH', decimalPlaces: 2 },
  { code: 'CNY', symbol: '¥', name: 'Chinese Yuan', locale: 'zh-CN', decimalPlaces: 2 },
  { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar', locale: 'en-SG', decimalPlaces: 2 },
  { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham', locale: 'ar-AE', decimalPlaces: 2 },
];

export const DEFAULT_CURRENCY = CURRENCIES[0]; // INR

export function formatCurrency(amount: number, currency: Currency): string {
  return new Intl.NumberFormat(currency.locale, {
    style: 'currency',
    currency: currency.code,
    minimumFractionDigits: currency.decimalPlaces,
    maximumFractionDigits: currency.decimalPlaces,
  }).format(amount);
}

export function getCurrencyByCode(code: string): Currency {
  return CURRENCIES.find(c => c.code === code) || DEFAULT_CURRENCY;
}
