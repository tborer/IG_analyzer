import { describe, expect, it } from 'vitest';
import { generateToken, hashToken } from '@/lib/tokens';

describe('generateToken', () => {
  it('produces a raw value whose hash matches the returned hash', () => {
    const { raw, hash } = generateToken();
    expect(hashToken(raw)).toBe(hash);
  });

  it('never returns the raw value equal to its hash', () => {
    const { raw, hash } = generateToken();
    expect(raw).not.toBe(hash);
  });

  it('produces different tokens on each call', () => {
    const a = generateToken();
    const b = generateToken();
    expect(a.raw).not.toBe(b.raw);
  });
});
