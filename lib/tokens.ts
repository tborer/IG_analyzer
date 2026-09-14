import { randomBytes, createHash } from 'crypto';

/**
 * Random tokens for email links (password reset, email verification).
 * Only the SHA-256 hash is ever stored, so a DB leak can't be replayed as
 * a live link -- the raw value exists only in the email itself.
 */
export function generateToken(): { raw: string; hash: string } {
  const raw = randomBytes(32).toString('hex');
  return { raw, hash: hashToken(raw) };
}

export function hashToken(raw: string): string {
  return createHash('sha256').update(raw).digest('hex');
}
