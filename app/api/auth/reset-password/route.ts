import { NextRequest, NextResponse } from 'next/server';
import { hashPassword } from '@/lib/auth';
import { resetPassword } from '@/lib/password-reset';
import { invalidateOtherSessions } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const { token, password } = await req.json().catch(() => ({}));
  if (typeof token !== 'string' || !token || typeof password !== 'string') {
    return NextResponse.json({ error: 'Token and new password are required.' }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json(
      { error: 'New password must be at least 8 characters.' },
      { status: 400 }
    );
  }

  const passwordHash = await hashPassword(password);
  const { result, userId } = await resetPassword(token, passwordHash);
  if (result === 'invalid_or_expired') {
    return NextResponse.json(
      { error: 'That reset link is invalid or has expired. Request a new one.' },
      { status: 400 }
    );
  }

  // §1.4: a stolen or already-used old session shouldn't survive a reset.
  // There's no "current session" to preserve here (the user isn't signed
  // in when resetting), so unlike change-password, nothing is reissued.
  await invalidateOtherSessions(userId!);

  return NextResponse.json({ ok: true });
}
