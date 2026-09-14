import { query } from './db';
import { sendEmail } from './email';
import { generateToken, hashToken } from './tokens';
import { SITE_URL } from './site';

const TOKEN_TTL_HOURS = 1;

export async function requestPasswordReset(email: string): Promise<void> {
  const rows = await query<{ id: string }>('select id from users where email = ?', [email]);
  const user = rows[0];
  // No enumeration signal either way: callers always show the same generic
  // message regardless of whether this actually sends anything.
  if (!user) return;

  const { raw, hash } = generateToken();
  const expiresAt = new Date(Date.now() + TOKEN_TTL_HOURS * 60 * 60 * 1000).toISOString();
  await query(
    'insert into password_reset_tokens (token_hash, user_id, expires_at) values (?, ?, ?)',
    [hash, user.id, expiresAt]
  );

  const resetUrl = `${SITE_URL}/reset-password?token=${raw}`;
  try {
    await sendEmail({
      to: email,
      subject: 'Reset your password',
      html: `
        <p>Someone requested a password reset for this account.</p>
        <p><a href="${resetUrl}">Choose a new password</a></p>
        <p>This link expires in ${TOKEN_TTL_HOURS} hour and can only be used once. If you didn't request this, you can ignore this email.</p>
      `,
    });
  } catch (err) {
    // Surfaced as a clear server-side signal (an outage is operable), but
    // never reflected back to the caller -- that would leak account
    // existence via a status/content difference. See §1.5 for the tradeoff.
    console.error('Failed to send password reset email:', err);
  }
}

export type ResetPasswordResult = 'ok' | 'invalid_or_expired';

export async function resetPassword(
  rawToken: string,
  newPasswordHash: string
): Promise<{ result: ResetPasswordResult; userId?: string }> {
  const hash = hashToken(rawToken);
  const rows = await query<{ user_id: string; expires_at: string; used_at: string | null }>(
    'select user_id, expires_at, used_at from password_reset_tokens where token_hash = ?',
    [hash]
  );
  const record = rows[0];
  if (!record || record.used_at || new Date(record.expires_at).getTime() < Date.now()) {
    return { result: 'invalid_or_expired' };
  }

  await query('update users set password_hash = ? where id = ?', [newPasswordHash, record.user_id]);
  await query("update password_reset_tokens set used_at = datetime('now') where token_hash = ?", [
    hash,
  ]);

  return { result: 'ok', userId: record.user_id };
}
