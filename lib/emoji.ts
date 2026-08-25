// Deterministic emoji-density measurement for bio text. Kept separate from
// the model's judgment -- "how many emoji is too many" is measured in code,
// not left to the LLM's qualitative read, so the verdict is consistent
// across audits.
const EMOJI_CODEPOINT = /\p{Extended_Pictographic}/u;

export type EmojiDensityResult = {
  emojiCount: number;
  totalGraphemes: number;
  ratio: number;
  verdict: 'clean' | 'moderate' | 'heavy';
};

function verdictFor(ratio: number): EmojiDensityResult['verdict'] {
  if (ratio > 0.15) return 'heavy';
  if (ratio > 0.05) return 'moderate';
  return 'clean';
}

export function computeEmojiDensity(text: string): EmojiDensityResult {
  // Segment by grapheme cluster (not UTF-16 code unit or bare code point) so
  // multi-codepoint emoji -- ZWJ sequences, skin-tone modifiers -- count as
  // one visible character instead of several.
  const segmenter = new Intl.Segmenter('en', { granularity: 'grapheme' });
  let emojiCount = 0;
  let totalGraphemes = 0;
  for (const { segment } of segmenter.segment(text)) {
    totalGraphemes++;
    if (EMOJI_CODEPOINT.test(segment)) emojiCount++;
  }
  const ratio = totalGraphemes === 0 ? 0 : emojiCount / totalGraphemes;
  return { emojiCount, totalGraphemes, ratio, verdict: verdictFor(ratio) };
}
