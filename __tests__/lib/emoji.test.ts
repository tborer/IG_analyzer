import { describe, expect, it } from 'vitest';
import { computeEmojiDensity } from '@/lib/emoji';

describe('computeEmojiDensity', () => {
  it('reports zero ratio for empty text', () => {
    const result = computeEmojiDensity('');
    expect(result.totalGraphemes).toBe(0);
    expect(result.emojiCount).toBe(0);
    expect(result.ratio).toBe(0);
    expect(result.verdict).toBe('clean');
  });

  it('reports zero ratio for text with no emoji', () => {
    const result = computeEmojiDensity('Business • Boxing • Books');
    expect(result.emojiCount).toBe(0);
    expect(result.verdict).toBe('clean');
  });

  it('is clean exactly at the 5% boundary (not moderate)', () => {
    const text = '🔥' + 'a'.repeat(19); // 1 emoji / 20 graphemes = 0.05
    const result = computeEmojiDensity(text);
    expect(result.totalGraphemes).toBe(20);
    expect(result.emojiCount).toBe(1);
    expect(result.ratio).toBeCloseTo(0.05);
    expect(result.verdict).toBe('clean');
  });

  it('is moderate just above the 5% boundary', () => {
    const text = '🔥🔥' + 'a'.repeat(18); // 2 / 20 = 0.10
    const result = computeEmojiDensity(text);
    expect(result.ratio).toBeCloseTo(0.1);
    expect(result.verdict).toBe('moderate');
  });

  it('is heavy above the 15% boundary', () => {
    const text = '🔥🔥🔥🔥' + 'a'.repeat(16); // 4 / 20 = 0.20
    const result = computeEmojiDensity(text);
    expect(result.ratio).toBeCloseTo(0.2);
    expect(result.verdict).toBe('heavy');
  });

  it('is heavy for an all-emoji bio', () => {
    const result = computeEmojiDensity('🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥');
    expect(result.totalGraphemes).toBe(10);
    expect(result.emojiCount).toBe(10);
    expect(result.ratio).toBe(1);
    expect(result.verdict).toBe('heavy');
  });

  it('counts a ZWJ family emoji sequence as one grapheme, not three', () => {
    const result = computeEmojiDensity('👨‍👩‍👧');
    expect(result.totalGraphemes).toBe(1);
    expect(result.emojiCount).toBe(1);
    expect(result.ratio).toBe(1);
  });
});
