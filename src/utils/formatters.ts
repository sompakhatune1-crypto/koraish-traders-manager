/**
 * Bangladeshi currency, numbers, and date formatters in Bengali (বাংলা)
 */

const BN_DIGITS = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
const EN_DIGITS: Record<string, string> = {
  '০': '0', '১': '1', '২': '2', '৩': '3', '৪': '4',
  '৫': '5', '৬': '6', '৭': '7', '৮': '8', '৯': '9',
};

/**
 * Convert English number or string to Bengali digits
 */
export function toBnDigits(value: number | string): string {
  if (value === null || value === undefined) return '';
  return String(value).replace(/[0-9]/g, (digit) => BN_DIGITS[parseInt(digit, 10)]);
}

/**
 * Convert Bengali digits to English digits
 */
export function toEnDigits(value: string): string {
  if (!value) return '';
  return value.replace(/[০-৯]/g, (ch) => EN_DIGITS[ch] || ch);
}

/**
 * Bangladeshi Taka Currency Formatter (e.g. ৳১,২৫,০০০)
 * South Asian numbering pattern (lakh, crore): ##,##,###
 */
export function formatTaka(amount: number, showDecimal = false): string {
  if (isNaN(amount) || amount === null || amount === undefined) {
    return '৳০';
  }

  const isNegative = amount < 0;
  const absAmount = Math.abs(amount);

  let formatted = '';
  if (showDecimal) {
    formatted = absAmount.toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  } else {
    formatted = Math.round(absAmount).toLocaleString('en-IN');
  }

  const bnAmount = toBnDigits(formatted);
  return `${isNegative ? '-' : ''}৳${bnAmount}`;
}

/**
 * Format Bag Quantity (e.g. "৫০ বস্তা")
 */
export function formatBags(bags: number): string {
  return `${toBnDigits(bags || 0)} বস্তা`;
}

/**
 * Format Date to DD/MM/YYYY in Asia/Dhaka timezone
 */
export function formatDate(isoDateString?: string | Date): string {
  if (!isoDateString) return '';
  const date = typeof isoDateString === 'string' ? new Date(isoDateString) : isoDateString;
  
  if (isNaN(date.getTime())) return '';

  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = String(date.getFullYear());

  return `${toBnDigits(day)}/${toBnDigits(month)}/${toBnDigits(year)}`;
}

/**
 * Format Date & Time with Bengali AM/PM
 */
export function formatDateTime(isoDateString?: string | Date): string {
  if (!isoDateString) return '';
  const date = typeof isoDateString === 'string' ? new Date(isoDateString) : isoDateString;
  
  if (isNaN(date.getTime())) return '';

  const d = formatDate(date);
  let hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const period = hours >= 12 ? 'বিকাল' : 'সকাল';
  hours = hours % 12 || 12;

  return `${d}, ${period} ${toBnDigits(hours)}:${toBnDigits(minutes)}`;
}

/**
 * Parse Bengali word numbers (e.g. পঞ্চাশ, ২০, দেড়শো, হাজার) into numeric value
 */
export function parseBanglaWordsToNumber(text: string): number | null {
  if (!text) return null;

  // Direct digits match
  const enDigits = toEnDigits(text);
  const digitMatch = enDigits.match(/\d+(\.\d+)?/);
  if (digitMatch) {
    return parseFloat(digitMatch[0]);
  }

  const wordMap: Record<string, number> = {
    'এক': 1, 'দুই': 2, 'তিন': 3, 'চার': 4, 'পাঁচ': 5,
    'ছয়': 6, 'সাত': 7, 'আট': 8, 'নয়': 9, 'দশ': 10,
    'এগারো': 11, 'বারো': 12, 'তেরো': 13, 'চৌদ্দ': 14, 'পনেরো': 15,
    'ষোল': 16, 'সতেরো': 17, 'আঠারো': 18, 'উনিশ': 19, 'বিশ': 20,
    'কুড়ি': 20, 'পঁচিশ': 25, 'ত্রিশ': 30, 'পঁয়ত্রিশ': 35, 'চল্লিশ': 40,
    'পঁয়তাল্লিশ': 45, 'পঞ্চাশ': 50, 'ষাট': 60, 'সত্তর': 70, 'আশি': 80,
    'নব্বই': 90, 'একশ': 100, 'একশত': 100, 'দেড়শ': 150, 'দেড়শত': 150,
    'দুইশ': 200, 'পাঁচশ': 500, 'হাজার': 1000, 'পাঁচ হাজার': 5000,
    'দশ হাজার': 10000, 'বিশ হাজার': 20000, 'পঞ্চাশ হাজার': 50000, 'এক লাখ': 100000,
  };

  const clean = text.trim();
  for (const [word, val] of Object.entries(wordMap)) {
    if (clean.includes(word)) {
      return val;
    }
  }

  return null;
}
