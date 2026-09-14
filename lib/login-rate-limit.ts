import { query } from '@/lib/db';

export interface LoginAttempt {
  id: string;
  email: string;
  ip: string;
  succeeded: number;
  created_at: string;
}

export async function recordLoginAttempt(email: string, ip: string, succeeded: number): Promise<void> {
  const id = `${email}-${ip}-${Date.now()}`;
  await query<LoginAttempt>(
    'insert into login_attempts (id, email, ip, succeeded, created_at) values (?, ?, ?, ?, ?)',
    [id, email, ip, succeeded, new Date().toISOString()]
  );
}

export async function isLockedOut(email: string, ip: string): Promise<boolean> {
  // Email-based lockout: 5 failed attempts within 15 minutes
  const emailLockout = await query<{ count: number }>(
    'select count(*) as count from login_attempts where email = ? and succeeded = 0 and created_at >= datetime(?, "-15 minutes")',
    [email, new Date().toISOString()]
  );

  // IP-based lockout: 20 failed attempts within 1 hour
  const ipLockout = await query<{ count: number }>(
    'select count(*) as count from login_attempts where ip = ? and succeeded = 0 and created_at >= datetime(?, "-1 hour")',
    [ip, new Date().toISOString()]
  );

  return emailLockout[0]?.count >= 5 || ipLockout[0]?.count >= 20;
}
