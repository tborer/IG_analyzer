import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyPassword, createSessionToken, SESSION_COOKIE, sessionCookieOptions } from '@/lib/auth';
import { recordLoginAttempt, isLockedOut } from '@/lib/login-rate-limit';

export async function POST(req: NextRequest) {
  const { email, password } = await req.json().catch(() => ({}));
  if (typeof email !== 'string' || typeof password !== 'string') {
    return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 });
  }

  const normalizedEmail = email.trim().toLowerCase();
  const clientIp = req.headers.get('x-forwarded-for') || 'unknown';
  
  // Check if account is locked out
  if (await isLockedOut(normalizedEmail, clientIp)) {
    return NextResponse.json({ error: 'Too many failed attempts. Try again later.' }, { status: 429 });
  }

  const rows = await query<{ id: string; password_hash: string }>(
    'select id, password_hash from users where email = ?',
    [normalizedEmail]
  );
  const user = rows[0];
  if (!user || !(await verifyPassword(password, user.password_hash))) {
    // Record failed attempt
    await recordLoginAttempt(normalizedEmail, clientIp, 0);
    return NextResponse.json({ error: 'Incorrect email or password.' }, { status: 401 });
  }

  // Record successful attempt
  await recordLoginAttempt(normalizedEmail, clientIp, 1);
  
  const token = await createSessionToken(user.id);
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, token, sessionCookieOptions);
  return res;
}
