import { describe, expect, it } from 'vitest';
import { checkBioStaleness } from '@/lib/bio-staleness';

describe('checkBioStaleness', () => {
  it('returns null with no prior audits', () => {
    expect(checkBioStaleness('Chicago to Bali • Currently Lisbon', [])).toBeNull();
  });

  it('returns null with only one matching prior audit (streak of 2)', () => {
    const bio = 'Chicago to Bali • Currently Lisbon';
    expect(checkBioStaleness(bio, [bio])).toBeNull();
  });

  it('flags a streak of 3 (current + 2 matching prior audits)', () => {
    const bio = 'Chicago to Bali • Currently Lisbon';
    const result = checkBioStaleness(bio, [bio, bio]);
    expect(result).not.toBeNull();
    expect(result?.streak).toBe(3);
    expect(result?.note).toContain('3 audits');
  });

  it('keeps counting past 3 for a longer streak', () => {
    const bio = 'Founder @brandname • LA • Featured in Forbes';
    const result = checkBioStaleness(bio, [bio, bio, bio, bio]);
    expect(result?.streak).toBe(5);
  });

  it('stops counting at the first mismatch', () => {
    const bio = 'Photographer • Published in Vogue • NYC';
    const older = 'Some completely different old bio';
    const result = checkBioStaleness(bio, [bio, bio, older, bio, bio]);
    expect(result?.streak).toBe(3); // current + the 2 matching before the mismatch
  });

  it('is not fooled by whitespace or case differences', () => {
    const current = 'Business • Boxing • Books';
    const priorVariant1 = '  business • boxing • books  ';
    const priorVariant2 = 'BUSINESS •   BOXING • BOOKS';
    const result = checkBioStaleness(current, [priorVariant1, priorVariant2]);
    expect(result?.streak).toBe(3);
  });

  it('returns null as soon as the most recent prior bio differs', () => {
    const result = checkBioStaleness('New bio', ['Old bio', 'Old bio', 'Old bio']);
    expect(result).toBeNull();
  });
});
