import { beforeEach, describe, expect, it, vi } from 'vitest';
import { hashToken } from '@/lib/tokens';

vi.mock('@/lib/db', () => ({
  query: vi.fn(),
}));

vi.mock('@/lib/email', () => ({
  sendEmail: vi.fn(),
}));

beforeEach(() => {
  vi.resetAllMocks();
});

describe('requestPasswordReset', () => {
  it('does nothing when the account does not exist (no enumeration signal)', async () => {
    const { query } = await import('@/lib/db');
    const { sendEmail } = await import('@/lib/email');
    vi.mocked(query).mockResolvedValueOnce([]); // user lookup: none found
    const { requestPasswordReset } = await import('@/lib/password-reset');

    await requestPasswordReset('nobody@example.com');

    expect(sendEmail).not.toHaveBeenCalled();
  });

  it('creates a token and emails the link when the account exists', async () => {
    const { query } = await import('@/lib/db');
    const { sendEmail } = await import('@/lib/email');
    vi.mocked(query).mockResolvedValueOnce([{ id: 'user-1' }]); // user lookup
    vi.mocked(query).mockResolvedValueOnce([]); // token insert
    const { requestPasswordReset } = await import('@/lib/password-reset');

    await requestPasswordReset('user@example.com');

    expect(query).toHaveBeenCalledWith(
      'insert into password_reset_tokens (token_hash, user_id, expires_at) values (?, ?, ?)',
      expect.arrayContaining(['user-1'])
    );
    expect(sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({ to: 'user@example.com', subject: expect.any(String) })
    );
  });

  it('swallows an email-provider failure without throwing', async () => {
    const { query } = await import('@/lib/db');
    const { sendEmail } = await import('@/lib/email');
    vi.mocked(query).mockResolvedValueOnce([{ id: 'user-1' }]);
    vi.mocked(query).mockResolvedValueOnce([]);
    vi.mocked(sendEmail).mockRejectedValueOnce(new Error('provider outage'));
    const { requestPasswordReset } = await import('@/lib/password-reset');

    await expect(requestPasswordReset('user@example.com')).resolves.toBeUndefined();
  });
});

describe('resetPassword', () => {
  it('rejects an unknown token', async () => {
    const { query } = await import('@/lib/db');
    vi.mocked(query).mockResolvedValueOnce([]); // token lookup: none
    const { resetPassword } = await import('@/lib/password-reset');

    const { result } = await resetPassword('raw-token', 'new-hash');
    expect(result).toBe('invalid_or_expired');
  });

  it('rejects an already-used token', async () => {
    const { query } = await import('@/lib/db');
    vi.mocked(query).mockResolvedValueOnce([
      {
        user_id: 'user-1',
        expires_at: new Date(Date.now() + 60_000).toISOString(),
        used_at: new Date().toISOString(),
      },
    ]);
    const { resetPassword } = await import('@/lib/password-reset');

    const { result } = await resetPassword('raw-token', 'new-hash');
    expect(result).toBe('invalid_or_expired');
  });

  it('rejects an expired token', async () => {
    const { query } = await import('@/lib/db');
    vi.mocked(query).mockResolvedValueOnce([
      { user_id: 'user-1', expires_at: new Date(Date.now() - 60_000).toISOString(), used_at: null },
    ]);
    const { resetPassword } = await import('@/lib/password-reset');

    const { result } = await resetPassword('raw-token', 'new-hash');
    expect(result).toBe('invalid_or_expired');
  });

  it('updates the password and marks the token used on success', async () => {
    const { query } = await import('@/lib/db');
    vi.mocked(query).mockResolvedValueOnce([
      { user_id: 'user-1', expires_at: new Date(Date.now() + 60_000).toISOString(), used_at: null },
    ]);
    vi.mocked(query).mockResolvedValueOnce([]); // password update
    vi.mocked(query).mockResolvedValueOnce([]); // mark used
    const { resetPassword } = await import('@/lib/password-reset');

    const { result, userId } = await resetPassword('raw-token', 'new-hash');

    expect(result).toBe('ok');
    expect(userId).toBe('user-1');
    expect(query).toHaveBeenCalledWith('update users set password_hash = ? where id = ?', [
      'new-hash',
      'user-1',
    ]);
  });

  it('token lookup uses the hash, not the raw token', async () => {
    const { query } = await import('@/lib/db');
    vi.mocked(query).mockResolvedValueOnce([]);
    const { resetPassword } = await import('@/lib/password-reset');

    await resetPassword('my-raw-token', 'new-hash');

    expect(query).toHaveBeenCalledWith(expect.any(String), [hashToken('my-raw-token')]);
  });
});
