import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/db', () => ({
  query: vi.fn(),
}));

vi.mock('@/lib/email', () => ({
  sendEmail: vi.fn(),
}));

beforeEach(() => {
  vi.resetAllMocks();
});

describe('sendVerificationEmail', () => {
  it('stores a hashed token and emails the raw link', async () => {
    const { query } = await import('@/lib/db');
    const { sendEmail } = await import('@/lib/email');
    vi.mocked(query).mockResolvedValueOnce([]); // token insert
    const { sendVerificationEmail } = await import('@/lib/verification');

    await sendVerificationEmail('user-1', 'user@example.com');

    expect(query).toHaveBeenCalledWith(
      'insert into email_verification_tokens (token_hash, user_id, expires_at) values (?, ?, ?)',
      expect.arrayContaining(['user-1'])
    );
    expect(sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({ to: 'user@example.com' })
    );
  });
});

describe('verifyEmailToken', () => {
  it('rejects an unknown token', async () => {
    const { query } = await import('@/lib/db');
    vi.mocked(query).mockResolvedValueOnce([]);
    const { verifyEmailToken } = await import('@/lib/verification');

    expect(await verifyEmailToken('raw')).toBe('invalid_or_expired');
  });

  it('rejects an expired token', async () => {
    const { query } = await import('@/lib/db');
    vi.mocked(query).mockResolvedValueOnce([
      { user_id: 'user-1', expires_at: new Date(Date.now() - 1000).toISOString() },
    ]);
    const { verifyEmailToken } = await import('@/lib/verification');

    expect(await verifyEmailToken('raw')).toBe('invalid_or_expired');
  });

  it('marks the email verified and deletes the token on success', async () => {
    const { query } = await import('@/lib/db');
    vi.mocked(query).mockResolvedValueOnce([
      { user_id: 'user-1', expires_at: new Date(Date.now() + 60_000).toISOString() },
    ]);
    vi.mocked(query).mockResolvedValueOnce([]); // update
    vi.mocked(query).mockResolvedValueOnce([]); // delete
    const { verifyEmailToken } = await import('@/lib/verification');

    expect(await verifyEmailToken('raw')).toBe('ok');
    expect(query).toHaveBeenCalledWith(
      "update users set email_verified_at = datetime('now') where id = ?",
      ['user-1']
    );
    expect(query).toHaveBeenCalledWith(
      'delete from email_verification_tokens where token_hash = ?',
      [expect.any(String)]
    );
  });
});
