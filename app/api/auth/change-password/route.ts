import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserId, hashPassword, verifyPassword } from '@/lib/auth';
import { query } from '@/lib/db';

export async function POST(req: NextRequest) {
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ error: 'Sign in first.' }, { status: 401 });
  }

  const { currentPassword, newPassword } = await req.json().catch(() => ({}));
  if (typeof currentPassword !== 'string' || typeof newPassword !== 'string') {
    return NextResponse.json(
      { error: 'Current and new password are required.' },
      { status: 400 }
    );
  }
  if (newPassword.length < 8) {
    return NextResponse.json(
      { error: 'New password must be at least 8 characters.' },
      { status: 400 }
    );
  }

  const rows = await query<{ password_hash: string }>(
    'select password_hash from users where id = ?',
    [userId]
  );
  const user = rows[0];
  if (!user || !(await verifyPassword(currentPassword, user.password_hash))) {
    return NextResponse.json({ error: 'Current password is incorrect.' }, { status: 401 });
  }

  const newHash = await hashPassword(newPassword);
  await query('update users set password_hash = ? where id = ?', [newHash, userId]);

  return NextResponse.json({ ok: true });
}
