import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/db', () => ({
  query: vi.fn(),
}));

beforeEach(() => {
  vi.resetAllMocks();
});

describe('recordLoginAttempt', () => {
  it('inserts a row keyed by email/ip/succeeded', async () => {
    const { query } = await import('@/lib/db');
    const { recordLoginAttempt } = await import('@/lib/login-rate-limit');

    await recordLoginAttempt('user@example.com', '1.2.3.4', 0);

    expect(query).toHaveBeenCalledWith(
      'insert into login_attempts (id, email, ip, succeeded, created_at) values (?, ?, ?, ?, ?)',
      expect.arrayContaining(['user@example.com', '1.2.3.4', 0])
    );
  });
});

describe('isLockedOut', () => {
  it('is not locked out when both counts are under threshold', async () => {
    const { query } = await import('@/lib/db');
    vi.mocked(query).mockResolvedValueOnce([{ count: 4 }]); // email count
    vi.mocked(query).mockResolvedValueOnce([{ count: 19 }]); // ip count
    const { isLockedOut } = await import('@/lib/login-rate-limit');

    expect(await isLockedOut('user@example.com', '1.2.3.4')).toBe(false);
  });

  it('locks out at the email threshold (5 failed attempts in 15 minutes)', async () => {
    const { query } = await import('@/lib/db');
    vi.mocked(query).mockResolvedValueOnce([{ count: 5 }]);
    vi.mocked(query).mockResolvedValueOnce([{ count: 0 }]);
    const { isLockedOut } = await import('@/lib/login-rate-limit');

    expect(await isLockedOut('user@example.com', '1.2.3.4')).toBe(true);
  });

  it('locks out at the IP threshold (20 failed attempts in 1 hour) independently of email', async () => {
    const { query } = await import('@/lib/db');
    vi.mocked(query).mockResolvedValueOnce([{ count: 0 }]);
    vi.mocked(query).mockResolvedValueOnce([{ count: 20 }]);
    const { isLockedOut } = await import('@/lib/login-rate-limit');

    expect(await isLockedOut('user@example.com', '1.2.3.4')).toBe(true);
  });

  it('scopes the email check to a 15-minute window', async () => {
    const { query } = await import('@/lib/db');
    vi.mocked(query).mockResolvedValueOnce([{ count: 0 }]);
    vi.mocked(query).mockResolvedValueOnce([{ count: 0 }]);
    const { isLockedOut } = await import('@/lib/login-rate-limit');

    await isLockedOut('user@example.com', '1.2.3.4');

    expect(query).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining('-15 minutes'),
      expect.arrayContaining(['user@example.com'])
    );
  });

  it('scopes the IP check to a 1-hour window', async () => {
    const { query } = await import('@/lib/db');
    vi.mocked(query).mockResolvedValueOnce([{ count: 0 }]);
    vi.mocked(query).mockResolvedValueOnce([{ count: 0 }]);
    const { isLockedOut } = await import('@/lib/login-rate-limit');

    await isLockedOut('user@example.com', '1.2.3.4');

    expect(query).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('-1 hour'),
      expect.arrayContaining(['1.2.3.4'])
    );
  });
});
