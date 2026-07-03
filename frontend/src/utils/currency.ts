// MuradERP Currency utilities — comprehensive ISO 4217 currency list
// Proprietary - All Rights Reserved © 2026 Murad Ghannam

export interface CurrencyInfo {
  code: string;
  name: string;
  nameAr: string;
  symbol: string;
}

export const currencies: CurrencyInfo[] = [
  { code: 'SAR', name: 'Saudi Riyal', nameAr: 'ريال سعودي', symbol: 'ر.س' },
  { code: 'AED', name: 'UAE Dirham', nameAr: 'درهم إماراتي', symbol: 'د.إ' },
  { code: 'KWD', name: 'Kuwaiti Dinar', nameAr: 'دينار كويتي', symbol: 'د.ك' },
  { code: 'BHD', name: 'Bahraini Dinar', nameAr: 'دينار بحريني', symbol: 'د.ب' },
  { code: 'QAR', name: 'Qatari Riyal', nameAr: 'ريال قطري', symbol: 'ر.ق' },
  { code: 'OMR', name: 'Omani Rial', nameAr: 'ريال عماني', symbol: 'ر.ع' },
  { code: 'JOD', name: 'Jordanian Dinar', nameAr: 'دينار أردني', symbol: 'د.أ' },
  { code: 'EGP', name: 'Egyptian Pound', nameAr: 'جنيه مصري', symbol: 'ج.م' },
  { code: 'LBP', name: 'Lebanese Pound', nameAr: 'ليرة لبنانية', symbol: 'ل.ل' },
  { code: 'IQD', name: 'Iraqi Dinar', nameAr: 'دينار عراقي', symbol: 'ع.د' },
  { code: 'YER', name: 'Yemeni Rial', nameAr: 'ريال يمني', symbol: 'ر.ي' },
  { code: 'SYP', name: 'Syrian Pound', nameAr: 'ليرة سورية', symbol: 'ل.س' },
  { code: 'LYD', name: 'Libyan Dinar', nameAr: 'دينار ليبي', symbol: 'ل.د' },
  { code: 'TND', name: 'Tunisian Dinar', nameAr: 'دينار تونسي', symbol: 'د.ت' },
  { code: 'DZD', name: 'Algerian Dinar', nameAr: 'دينار جزائري', symbol: 'د.ج' },
  { code: 'MAD', name: 'Moroccan Dirham', nameAr: 'درهم مغربي', symbol: 'د.م' },
  { code: 'SDG', name: 'Sudanese Pound', nameAr: 'جنيه سوداني', symbol: 'ج.س' },
  { code: 'USD', name: 'US Dollar', nameAr: 'دولار أمريكي', symbol: '$' },
  { code: 'EUR', name: 'Euro', nameAr: 'يورو', symbol: '€' },
  { code: 'GBP', name: 'British Pound', nameAr: 'جنيه إسترليني', symbol: '£' },
  { code: 'CHF', name: 'Swiss Franc', nameAr: 'فرنك سويسري', symbol: 'CHF' },
  { code: 'JPY', name: 'Japanese Yen', nameAr: 'ين ياباني', symbol: '¥' },
  { code: 'CNY', name: 'Chinese Yuan', nameAr: 'يوان صيني', symbol: '¥' },
  { code: 'HKD', name: 'Hong Kong Dollar', nameAr: 'دولار هونج كونج', symbol: 'HK$' },
  { code: 'SGD', name: 'Singapore Dollar', nameAr: 'دولار سنغافوري', symbol: 'S$' },
  { code: 'INR', name: 'Indian Rupee', nameAr: 'روبية هندية', symbol: '₹' },
  { code: 'PKR', name: 'Pakistani Rupee', nameAr: 'روبية باكستانية', symbol: '₨' },
  { code: 'BDT', name: 'Bangladeshi Taka', nameAr: 'تاكا بنغلاديشية', symbol: '৳' },
  { code: 'LKR', name: 'Sri Lankan Rupee', nameAr: 'روبية سريلانكية', symbol: 'Rs' },
  { code: 'NPR', name: 'Nepalese Rupee', nameAr: 'روبية نيبالية', symbol: 'Rs' },
  { code: 'PHP', name: 'Philippine Peso', nameAr: 'بيزو فلبيني', symbol: '₱' },
  { code: 'IDR', name: 'Indonesian Rupiah', nameAr: 'روبية إندونيسية', symbol: 'Rp' },
  { code: 'MYR', name: 'Malaysian Ringgit', nameAr: 'رينغيت ماليزي', symbol: 'RM' },
  { code: 'THB', name: 'Thai Baht', nameAr: 'بات تايلندي', symbol: '฿' },
  { code: 'VND', name: 'Vietnamese Dong', nameAr: 'دونغ فيتنامي', symbol: '₫' },
  { code: 'KRW', name: 'South Korean Won', nameAr: 'وون كوري جنوبي', symbol: '₩' },
  { code: 'TRY', name: 'Turkish Lira', nameAr: 'ليرة تركية', symbol: '₺' },
  { code: 'RUB', name: 'Russian Ruble', nameAr: 'روبل روسي', symbol: '₽' },
  { code: 'ZAR', name: 'South African Rand', nameAr: 'راند جنوب أفريقي', symbol: 'R' },
  { code: 'NGN', name: 'Nigerian Naira', nameAr: 'نايرا نيجيرية', symbol: '₦' },
  { code: 'KES', name: 'Kenyan Shilling', nameAr: 'شلن كيني', symbol: 'KSh' },
  { code: 'ETB', name: 'Ethiopian Birr', nameAr: 'بير إثيوبي', symbol: 'Br' },
  { code: 'GHS', name: 'Ghanaian Cedi', nameAr: 'سيدي غاني', symbol: 'GH₵' },
  { code: 'AUD', name: 'Australian Dollar', nameAr: 'دولار أسترالي', symbol: 'A$' },
  { code: 'NZD', name: 'New Zealand Dollar', nameAr: 'دولار نيوزيلندي', symbol: 'NZ$' },
  { code: 'CAD', name: 'Canadian Dollar', nameAr: 'دولار كندي', symbol: 'C$' },
  { code: 'MXN', name: 'Mexican Peso', nameAr: 'بيزو مكسيكي', symbol: 'MX$' },
  { code: 'BRL', name: 'Brazilian Real', nameAr: 'ريال برازيلي', symbol: 'R$' },
  { code: 'ARS', name: 'Argentine Peso', nameAr: 'بيزو أرجنتيني', symbol: 'AR$' },
  { code: 'CLP', name: 'Chilean Peso', nameAr: 'بيزو تشيلي', symbol: 'CL$' },
  { code: 'COP', name: 'Colombian Peso', nameAr: 'بيزو كولومبي', symbol: 'CO$' },
  { code: 'SEK', name: 'Swedish Krona', nameAr: 'كرونة سويدية', symbol: 'kr' },
  { code: 'NOK', name: 'Norwegian Krone', nameAr: 'كرونة نرويجية', symbol: 'kr' },
  { code: 'DKK', name: 'Danish Krone', nameAr: 'كرونة دنماركية', symbol: 'kr' },
  { code: 'PLN', name: 'Polish Zloty', nameAr: 'زلوتي بولندي', symbol: 'zł' },
  { code: 'CZK', name: 'Czech Koruna', nameAr: 'كرونة تشيكية', symbol: 'Kč' },
  { code: 'ILS', name: 'Israeli Shekel', nameAr: 'شيكل إسرائيلي', symbol: '₪' },
  { code: 'AFN', name: 'Afghan Afghani', nameAr: 'أفغاني', symbol: '؋' },
  { code: 'IRR', name: 'Iranian Rial', nameAr: 'ريال إيراني', symbol: '﷼' },
  { code: 'AZN', name: 'Azerbaijani Manat', nameAr: 'مانات أذربيجاني', symbol: '₼' },
  { code: 'KZT', name: 'Kazakhstani Tenge', nameAr: 'تينغ كازاخستاني', symbol: '₸' },
  { code: 'UAH', name: 'Ukrainian Hryvnia', nameAr: 'هريفنيا أوكرانية', symbol: '₴' },
];

const currencyByCode = new Map(currencies.map((c) => [c.code, c]));

export function getCurrencySymbol(code: string): string {
  return currencyByCode.get(code)?.symbol || code;
}

/**
 * Formats a numeric amount according to the given ISO 4217 currency code,
 * using the browser's Intl API so grouping/decimals follow real currency rules
 * (e.g. JPY has 0 decimals, KWD has 3, most others have 2).
 */
export function formatCurrency(amount: number, code: string, locale = 'en-US'): string {
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: code,
      currencyDisplay: 'symbol',
    }).format(amount);
  } catch {
    // Fallback for currency codes Intl doesn't recognize
    return `${amount.toLocaleString(locale)} ${getCurrencySymbol(code)}`;
  }
}
