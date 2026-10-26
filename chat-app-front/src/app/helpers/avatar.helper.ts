export const TELEGRAM_AVATAR_GRADIENTS = [
  'linear-gradient(135deg, #e17076, #ff885e)', // Red-Orange
  'linear-gradient(135deg, #faa774, #ff885e)', // Orange
  'linear-gradient(135deg, #a695e7, #7e65e4)', // Violet-Purple
  'linear-gradient(135deg, #7bc862, #4fae4e)', // Green
  'linear-gradient(135deg, #6ec9cb, #36a8aa)', // Cyan
  'linear-gradient(135deg, #65aadd, #2f8cc8)', // Blue
  'linear-gradient(135deg, #ee7aae, #d44e8c)', // Pink
];

export function getTelegramGradient(seed?: string): string {
  if (!seed) return TELEGRAM_AVATAR_GRADIENTS[0];
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return TELEGRAM_AVATAR_GRADIENTS[hash % TELEGRAM_AVATAR_GRADIENTS.length];
}

export function getInitials(firstName?: string, lastName?: string, fallback = '؟'): string {
  const f = (firstName ?? '').trim();
  const l = (lastName ?? '').trim();
  if (f && l) return `${f.charAt(0)}${l.charAt(0)}`;
  if (f) return f.charAt(0);
  if (l) return l.charAt(0);
  return fallback;
}

