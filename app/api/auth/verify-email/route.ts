import { NextRequest, NextResponse } from 'next/server';
import { verifyEmailToken } from '@/lib/verification';

export async function POST(req: NextRequest) {
  const { token } = await req.json().catch(() => ({}));
  if (typeof token !== 'string' || !token) {
    return NextResponse.json({ error: 'Missing verification token.' }, { status: 400 });
  }

  const result = await verifyEmailToken(token);
  if (result === 'invalid_or_expired') {
    return NextResponse.json(
      { error: 'That verification link is invalid or has expired.' },
      { status: 400 }
    );
  }

  return NextResponse.json({ ok: true });
}
