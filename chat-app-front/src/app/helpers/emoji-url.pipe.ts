import { Pipe, PipeTransform } from '@angular/core';

export function toEmojiCodePoint(unicodeSurrogates: string): string {
  if (!unicodeSurrogates) return '';
  const str = unicodeSurrogates.trim();
  if (str.startsWith('http') || str.startsWith('assets/') || str.endsWith('.svg') || str.endsWith('.png')) {
    return str;
  }

  const r: string[] = [];
  let c = 0;
  let p = 0;
  let i = 0;
  while (i < str.length) {
    c = str.charCodeAt(i++);
    if (p) {
      r.push((0x10000 + ((p - 0xd800) << 10) + (c - 0xdc00)).toString(16));
      p = 0;
    } else if (0xd800 <= c && c <= 0xdbff) {
      p = c;
    } else {
      r.push(c.toString(16));
    }
  }
  const hasZwiz = r.includes('200d');
  return (hasZwiz ? r : r.filter((x) => x !== 'fe0f')).join('-');
}

export function getEmojiUrl(emoji: string): string {
  if (!emoji) return '';
  const trimmed = emoji.trim();
  if (trimmed.startsWith('http') || trimmed.startsWith('assets/') || trimmed.endsWith('.svg') || trimmed.endsWith('.png')) {
    return trimmed;
  }
  const cp = toEmojiCodePoint(trimmed);
  return `assets/emojis/${cp}.svg`;
}

@Pipe({
  name: 'emojiUrl',
  standalone: true,
  pure: true,
})
export class EmojiUrlPipe implements PipeTransform {
  transform(emoji: string | undefined | null): string {
    if (!emoji) return '';
    return getEmojiUrl(emoji);
  }
}
