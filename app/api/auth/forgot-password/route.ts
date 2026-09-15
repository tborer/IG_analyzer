import { NextRequest, NextResponse } from 'next/server';
import { requestPasswordReset } from '@/lib/password-reset';

const GENERIC_MESSAGE = 'If that email is registered, a reset link is on its way.';

export async function POST(req: NextRequest) {
  const { email } = await req.json().catch(() => ({}));
  if (typeof email !== 'string' || !email.trim()) {
    // Still generic: an empty/malformed field is not an enumeration vector,
    // but there's no account to react to either way.
    return NextResponse.json({ ok: true, message: GENERIC_MESSAGE });
  }

  await requestPasswordReset(email.trim().toLowerCase());

  return NextResponse.json({ ok: true, message: GENERIC_MESSAGE });
}
