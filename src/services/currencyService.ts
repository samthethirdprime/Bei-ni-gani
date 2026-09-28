// Currency service supporting worldwide currencies with clean local symbols

export interface CurrencyConfig {
  code: string;
  symbol: string;
  name: string;
  symbolPosition: 'before' | 'after';
  decimalPlaces: number;
}

export const SUPPORTED_CURRENCIES: Record<string, CurrencyConfig> = {
  KES: { code: 'KES', symbol: 'KSh', name: 'Kenyan Shilling', symbolPosition: 'after', decimalPlaces: 0 },
  USD: { code: 'USD', symbol: '$', name: 'US Dollar', symbolPosition: 'before', decimalPlaces: 2 },
  GBP: { code: 'GBP', symbol: '£', name: 'British Pound', symbolPosition: 'before', decimalPlaces: 2 },
  EUR: { code: 'EUR', symbol: '€', name: 'Euro', symbolPosition: 'before', decimalPlaces: 2 },
  NGN: { code: 'NGN', symbol: '₦', name: 'Nigerian Naira', symbolPosition: 'before', decimalPlaces: 0 },
  ZAR: { code: 'ZAR', symbol: 'R', name: 'South African Rand', symbolPosition: 'before', decimalPlaces: 0 },
  CAD: { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar', symbolPosition: 'before', decimalPlaces: 2 },
  AUD: { code: 'AUD', symbol: 'A$', name: 'Australian Dollar', symbolPosition: 'before', decimalPlaces: 2 },
  AED: { code: 'AED', symbol: 'AED', name: 'UAE Dirham', symbolPosition: 'after', decimalPlaces: 0 },
  INR: { code: 'INR', symbol: '₹', name: 'Indian Rupee', symbolPosition: 'before', decimalPlaces: 0 },
  UGX: { code: 'UGX', symbol: 'UGX', name: 'Ugandan Shilling', symbolPosition: 'after', decimalPlaces: 0 },
  TZS: { code: 'TZS', symbol: 'TZS', name: 'Tanzanian Shilling', symbolPosition: 'after', decimalPlaces: 0 },
  RWF: { code: 'RWF', symbol: 'RWF', name: 'Rwandan Franc', symbolPosition: 'after', decimalPlaces: 0 },
  GHS: { code: 'GHS', symbol: 'GH₵', name: 'Ghanaian Cedi', symbolPosition: 'before', decimalPlaces: 2 },
  EGP: { code: 'EGP', symbol: 'E£', name: 'Egyptian Pound', symbolPosition: 'before', decimalPlaces: 0 }
};

export function getCurrencyForCountry(countryName?: string): string {
  if (!countryName) return 'KES';
  const clean = countryName.toLowerCase().trim();

  if (clean === 'kenya' || clean === 'ke') return 'KES';
  if (clean === 'united states' || clean === 'usa' || clean === 'us' || clean === 'america') return 'USD';
  if (clean === 'united kingdom' || clean === 'uk' || clean === 'britain' || clean === 'england' || clean === 'scotland') return 'GBP';
  if (clean === 'nigeria' || clean === 'ng') return 'NGN';
  if (clean === 'south africa' || clean === 'za') return 'ZAR';
  if (clean === 'canada' || clean === 'ca') return 'CAD';
  if (clean === 'australia' || clean === 'au') return 'AUD';
  if (clean === 'germany' || clean === 'france' || clean === 'spain' || clean === 'italy' || clean === 'netherlands' || clean === 'europe') return 'EUR';
  if (clean === 'united arab emirates' || clean === 'uae' || clean === 'dubai') return 'AED';
  if (clean === 'india' || clean === 'in') return 'INR';
  if (clean === 'uganda' || clean === 'ug') return 'UGX';
  if (clean === 'tanzania' || clean === 'tz') return 'TZS';
  if (clean === 'rwanda' || clean === 'rw') return 'RWF';
  if (clean === 'ghana' || clean === 'gh') return 'GHS';
  if (clean === 'egypt' || clean === 'eg') return 'EGP';

  return 'KES';
}

export function formatPrice(amount: number, currencyCode: string = 'KES'): string {
  const code = (currencyCode || 'KES').toUpperCase().trim();
  const config = SUPPORTED_CURRENCIES[code] || {
    code,
    symbol: code,
    name: code,
    symbolPosition: 'before',
    decimalPlaces: 0
  };

  const formattedNum = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: config.decimalPlaces > 0 ? (amount % 1 === 0 ? 0 : config.decimalPlaces) : 0,
    maximumFractionDigits: config.decimalPlaces
  }).format(amount);

  if (config.symbolPosition === 'after') {
    return `${formattedNum} ${config.symbol}`;
  } else {
    return `${config.symbol}${formattedNum}`;
  }
}
