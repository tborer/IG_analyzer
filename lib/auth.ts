import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';
import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { query } from './db';

export const SESSION_COOKIE = 'session';
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 days

function getSecret() {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error('SESSION_SECRET is not set. Add it to your environment.');
  }
  return new TextEncoder().encode(secret);
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export async function createSessionToken(userId: string) {
  return new SignJWT({ uid: userId, sid: randomUUID() })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE_SECONDS}s`)
    .sign(getSecret());
}

interface SessionPayload {
  uid: string;
  sid: string;
  iat: number;
}

async function verifySessionPayload(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    if (
      typeof payload.uid !== 'string' ||
      typeof payload.sid !== 'string' ||
      typeof payload.iat !== 'number'
    ) {
      return null;
    }
    return { uid: payload.uid, sid: payload.sid, iat: payload.iat };
  } catch {
    return null;
  }
}

/**
 * Validates signature/expiry, then checks the session against the
 * revocation store: an explicit per-session denylist (logout) and a
 * per-user "invalidate everything issued before X" cutoff (password
 * change/reset) -- see §1.4 in OUTSTANDING_WORK.md for the design.
 */
export async function verifySessionToken(token: string): Promise<string | null> {
  const payload = await verifySessionPayload(token);
  if (!payload) return null;

  const revoked = await query('select 1 from revoked_sessions where sid = ?', [payload.sid]);
  if (revoked.length > 0) return null;

  const rows = await query<{ sessions_invalidated_at: string | null }>(
    'select sessions_invalidated_at from users where id = ?',
    [payload.uid]
  );
  const invalidatedAt = rows[0]?.sessions_invalidated_at;
  if (invalidatedAt) {
    // SQLite's datetime('now') yields 'YYYY-MM-DD HH:MM:SS' (UTC, no zone
    // marker) -- normalize to an ISO string so Date parses it as UTC rather
    // than local time.
    const isoInvalidatedAt = `${invalidatedAt.replace(' ', 'T')}Z`;
    const cutoffSeconds = Math.floor(new Date(isoInvalidatedAt).getTime() / 1000);
    if (payload.iat < cutoffSeconds) return null;
  }

  return payload.uid;
}

/** Session id for the current cookie, for logout to revoke -- null if absent/invalid. */
export async function getSessionId(token: string): Promise<string | null> {
  const payload = await verifySessionPayload(token);
  return payload?.sid ?? null;
}

export async function revokeSession(sid: string): Promise<void> {
  await query('insert into revoked_sessions (sid) values (?)', [sid]);
}

/**
 * "Log out everywhere but here": callers must reissue a fresh token for the
 * current session immediately after calling this (its iat will land at or
 * after this cutoff, so it keeps passing verifySessionToken).
 */
export async function invalidateOtherSessions(userId: string): Promise<void> {
  await query("update users set sessions_invalidated_at = datetime('now') where id = ?", [userId]);
}

export const sessionCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
  maxAge: SESSION_MAX_AGE_SECONDS,
};

/** Server Component helper — read-only. Use in pages/layouts to check auth. */
export async function getCurrentUserId(): Promise<string | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}
