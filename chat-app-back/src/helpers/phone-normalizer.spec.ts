import { normalizePhoneNumber, convertDigitsToEnglish, getPhoneLookupCandidates } from './phone-normalizer';

describe('PhoneNormalizer', () => {
  it('converts Persian and Arabic digits to English', () => {
    expect(convertDigitsToEnglish('۰۹۱۲۳۴۵۶۷۸۹')).toBe('09123456789');
    expect(convertDigitsToEnglish('٠١٢٣٤٥٦٧٨٩')).toBe('0123456789');
  });

  it('normalizes Iranian numbers from various formats to E.164 (+98...) canonical format', () => {
    const expected = '+989224363738';
    expect(normalizePhoneNumber('09224363738')).toBe(expected);
    expect(normalizePhoneNumber('9224363738')).toBe(expected);
    expect(normalizePhoneNumber('989224363738')).toBe(expected);
    expect(normalizePhoneNumber('+989224363738')).toBe(expected);
    expect(normalizePhoneNumber('۰۹۲۲۴۳۶۳۷۳۸')).toBe(expected);
    expect(normalizePhoneNumber('0922 436 3738')).toBe(expected);
    expect(normalizePhoneNumber('+98 (922) 436-3738')).toBe(expected);
    expect(normalizePhoneNumber('00989224363738')).toBe(expected);
  });

  it('normalizes international numbers', () => {
    expect(normalizePhoneNumber('+1 (555) 123-4567')).toBe('+15551234567');
    expect(normalizePhoneNumber('00447123456789')).toBe('+447123456789');
  });

  it('generates all lookup candidates for matching backward compatibility', () => {
    const candidates = getPhoneLookupCandidates('۰۹۱۲۱۲۳۴۵۶۷');
    expect(candidates).toContain('+989121234567');
    expect(candidates).toContain('09121234567');
    expect(candidates).toContain('989121234567');
    expect(candidates).toContain('9121234567');
  });
});
