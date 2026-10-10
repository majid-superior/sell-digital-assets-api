/**
 * Default Currencies Configuration
 * Sourced during database initialization and reset migrations.
 */

export interface CurrencyInfo {
  code: string;
  name: string;
  symbol: string;
}

export const defaultCurrencies: CurrencyInfo[] = [
  { code: "PKR", name: "Pakistani Rupee", symbol: "₨" },
  { code: "USD", name: "United States Dollar", symbol: "$" },
  { code: "EUR", name: "Euro", symbol: "€" },
  { code: "GBP", name: "British Pound", symbol: "£" },
  { code: "JPY", name: "Japanese Yen", symbol: "¥" },
  { code: "INR", name: "Indian Rupee", symbol: "₹" },
  { code: "CNY", name: "Chinese Yuan", symbol: "¥" },
];

export const TOP_CURRENCIES = defaultCurrencies;

export const defaultCurrency: CurrencyInfo = {
  code: "PKR",
  name: "Pakistani Rupee",
  symbol: "₨",
};

