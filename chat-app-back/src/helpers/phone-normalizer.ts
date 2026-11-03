/**
 * Phone number normalization utility.
 * Converts any phone input (Persian/Arabic digits, various prefixes, symbols, spaces)
 * into a canonical E.164-compatible format.
 *
 * For Iranian numbers:
 * 09121234567, 9121234567, 989121234567, +989121234567, ۰۹۱۲۱۲۳۴۵۶۷ -> +989121234567
 *
 * For international numbers:
 * +1 555-123-4567 -> +15551234567
 * 001 555 1234567 -> +15551234567
 */

const PERSIAN_ARABIC_DIGITS: Record<string, string> = {
  '۰': '0',
  '۱': '1',
  '۲': '2',
  '۳': '3',
  '۴': '4',
  '۵': '5',
  '۶': '6',
  '۷': '7',
  '۸': '8',
  '۹': '9',
  '٠': '0',
  '١': '1',
  '٢': '2',
  '٣': '3',
  '٤': '4',
  '٥': '5',
  '٦': '6',
  '٧': '7',
  '٨': '8',
  '٩': '9',
};

export function convertDigitsToEnglish(input: string): string {
  if (!input) return '';
  return input.replace(/[۰-۹٠-٩]/g, (char) => PERSIAN_ARABIC_DIGITS[char] ?? char);
}

export function normalizePhoneNumber(rawPhone: string, defaultCountryCode: string = '98'): string {
  if (!rawPhone) return '';

  // 1. Convert all Persian and Arabic digits to English
  const englishInput = convertDigitsToEnglish(rawPhone.trim());

  // 2. Remove all spaces, dashes, dots, parentheses, and invalid characters except leading '+'
  const hasPlusPrefix = englishInput.startsWith('+');
  const digits = englishInput.replace(/\D/g, '');

  if (!digits) return '';

  // If number starts with 00 (e.g. 0098912...), treat as international prefix '+'
  if (digits.startsWith('00')) {
    return '+' + digits.slice(2);
  }

  // If input explicitly had '+', keep it with its digits
  if (hasPlusPrefix) {
    return '+' + digits;
  }

  // Iranian numbers detection and formatting
  if (digits.startsWith('98') && digits.length >= 12) {
    return '+' + digits;
  }

  if (digits.startsWith('09') && digits.length === 11) {
    return '+98' + digits.slice(1);
  }

  if (digits.startsWith('9') && digits.length === 10) {
    return '+98' + digits;
  }

  // If defaultCountryCode provided and digits start with 0, replace 0 with country code
  if (defaultCountryCode) {
    const cleanDefault = defaultCountryCode.replace(/\D/g, '');
    if (digits.startsWith('0')) {
      return '+' + cleanDefault + digits.slice(1);
    }
    return '+' + cleanDefault + digits;
  }

  return '+' + digits;
}

/**
 * Returns an array of search / query candidates for matching phone numbers in database
 * during migrations or search, supporting canonical +98, 09, 98, and 9... formats.
 */
export function getPhoneLookupCandidates(rawPhone: string): string[] {
  const normalized = normalizePhoneNumber(rawPhone);
  if (!normalized) return [];

  const candidates = new Set<string>();
  candidates.add(normalized); // e.g. +989121234567

  const digits = normalized.replace(/\D/g, ''); // e.g. 989121234567
  candidates.add(digits);

  if (digits.startsWith('98')) {
    const nationalWithoutZero = digits.slice(2); // e.g. 9121234567
    const nationalWithZero = '0' + nationalWithoutZero; // e.g. 09121234567
    candidates.add(nationalWithZero);
    candidates.add(nationalWithoutZero);
  }

  return Array.from(candidates);
}
