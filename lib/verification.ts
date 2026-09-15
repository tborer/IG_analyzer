import { query } from './db';
import { sendEmail } from './email';
import { generateToken, hashToken } from './tokens';
import { SITE_URL } from './site';

const TOKEN_TTL_HOURS = 24;

export async function sendVerificationEmail(userId: string, email: string): Promise<void> {
  const { raw, hash } = generateToken();
  const expiresAt = new Date(Date.now() + TOKEN_TTL_HOURS * 60 * 60 * 1000).toISOString();

  await query(
    'insert into email_verification_tokens (token_hash, user_id, expires_at) values (?, ?, ?)',
    [hash, userId, expiresAt]
  );

  const verifyUrl = `${SITE_URL}/verify-email?token=${raw}`;
  await sendEmail({
    to: email,
    subject: 'Verify your email address',
    html: `
      <p>Confirm this is your email address to finish setting up your account.</p>
      <p><a href="${verifyUrl}">Verify email address</a></p>
      <p>This link expires in ${TOKEN_TTL_HOURS} hours. If you didn't create this account, you can ignore this email.</p>
    `,
  });
}

export type VerifyEmailResult = 'ok' | 'invalid_or_expired';

export async function verifyEmailToken(rawToken: string): Promise<VerifyEmailResult> {
  const hash = hashToken(rawToken);
  const rows = await query<{ user_id: string; expires_at: string }>(
    'select user_id, expires_at from email_verification_tokens where token_hash = ?',
    [hash]
  );
  const record = rows[0];
  if (!record || new Date(record.expires_at).getTime() < Date.now()) {
    return 'invalid_or_expired';
  }

  await query('update users set email_verified_at = datetime(\'now\') where id = ?', [record.user_id]);
  await query('delete from email_verification_tokens where token_hash = ?', [hash]);
  return 'ok';
}
