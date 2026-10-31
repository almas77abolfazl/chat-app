import { EmojiUrlPipe, toEmojiCodePoint, getEmojiUrl } from './emoji-url.pipe';

describe('EmojiUrlPipe', () => {
  const pipe = new EmojiUrlPipe();

  it('should transform standard emojis to local SVG paths', () => {
    expect(pipe.transform('❤️')).toBe('assets/emojis/2764.svg');
    expect(pipe.transform('👍')).toBe('assets/emojis/1f44d.svg');
    expect(pipe.transform('😂')).toBe('assets/emojis/1f602.svg');
    expect(pipe.transform('🔥')).toBe('assets/emojis/1f525.svg');
  });

  it('should return empty string for null or undefined', () => {
    expect(pipe.transform(null)).toBe('');
    expect(pipe.transform(undefined)).toBe('');
    expect(pipe.transform('')).toBe('');
  });

  it('should preserve already formatted image paths', () => {
    expect(pipe.transform('assets/emojis/1f525.svg')).toBe('assets/emojis/1f525.svg');
    expect(pipe.transform('https://example.com/emoji.png')).toBe('https://example.com/emoji.png');
  });

  it('should extract correct codepoints with toEmojiCodePoint', () => {
    expect(toEmojiCodePoint('🎉')).toBe('1f389');
    expect(toEmojiCodePoint('👏')).toBe('1f44f');
  });
});
