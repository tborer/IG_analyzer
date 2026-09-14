import { NextResponse } from 'next/server';
import { getCurrentUserId } from '@/lib/auth';
import { query } from '@/lib/db';
import { sendVerificationEmail } from '@/lib/verification';

export async function POST() {
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ error: 'Sign in first.' }, { status: 401 });
  }

  const rows = await query<{ email: string; email_verified_at: string | null }>(
    'select email, email_verified_at from users where id = ?',
    [userId]
  );
  const user = rows[0];
  if (!user) {
    return NextResponse.json({ error: 'Account not found.' }, { status: 404 });
  }
  if (user.email_verified_at) {
    return NextResponse.json({ ok: true, alreadyVerified: true });
  }

  try {
    await sendVerificationEmail(userId, user.email);
  } catch (err) {
    console.error('Failed to resend verification email:', err);
    return NextResponse.json(
      { error: "We couldn't send the email right now — try again in a few minutes." },
      { status: 502 }
    );
  }

  return NextResponse.json({ ok: true });
}
