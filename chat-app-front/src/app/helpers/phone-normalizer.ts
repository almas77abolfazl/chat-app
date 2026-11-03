/**
 * Phone number normalization utility for frontend.
 * Converts any phone input (Persian/Arabic digits, various prefixes, symbols, spaces)
 * into a canonical E.164-compatible format.
 */

const PERSIAN_ARABIC_DIGITS: Record<string, string> = {
  '۰': '0', '۱': '1', '۲': '2', '۳': '3', '۴': '4',
  '۵': '5', '۶': '6', '۷': '7', '۸': '8', '۹': '9',
  '٠': '0', '١': '1', '٢': '2', '٣': '3', '٤': '4',
  '٥': '5', '٦': '6', '٧': '7', '٨': '8', '٩': '9',
};

export function convertDigitsToEnglish(input: string): string {
  if (!input) return '';
  return input.replace(/[۰-۹٠-٩]/g, (char) => PERSIAN_ARABIC_DIGITS[char] ?? char);
}

export function normalizePhoneNumber(rawPhone: string, defaultCountryCode: string = '98'): string {
  if (!rawPhone) return '';

  const englishInput = convertDigitsToEnglish(rawPhone.trim());
  const hasPlusPrefix = englishInput.startsWith('+');
  const digits = englishInput.replace(/\D/g, '');

  if (!digits) return '';

  if (digits.startsWith('00')) {
    return '+' + digits.slice(2);
  }

  if (hasPlusPrefix) {
    return '+' + digits;
  }

  if (digits.startsWith('98') && digits.length >= 12) {
    return '+' + digits;
  }

  if (digits.startsWith('09') && digits.length === 11) {
    return '+98' + digits.slice(1);
  }

  if (digits.startsWith('9') && digits.length === 10) {
    return '+98' + digits;
  }

  if (defaultCountryCode) {
    const cleanDefault = defaultCountryCode.replace(/\D/g, '');
    if (digits.startsWith('0')) {
      return '+' + cleanDefault + digits.slice(1);
    }
    return '+' + cleanDefault + digits;
  }

  return '+' + digits;
}
