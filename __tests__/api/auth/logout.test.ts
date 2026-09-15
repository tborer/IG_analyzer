import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/db', () => ({
  query: vi.fn(),
}));

vi.mock('next/headers', () => ({
  cookies: vi.fn(),
}));

beforeAll(() => {
  process.env.SESSION_SECRET = 'test-secret-do-not-use-in-production';
});

beforeEach(() => {
  vi.resetAllMocks();
});

describe('POST /api/auth/logout', () => {
  it('clears the cookie without touching the db when signed out', async () => {
    const { cookies } = await import('next/headers');
    vi.mocked(cookies).mockResolvedValue({ get: () => undefined } as any);
    const { query } = await import('@/lib/db');
    const { POST } = await import('@/app/api/auth/logout/route');

    const res = await POST();

    expect(res.status).toBe(200);
    expect(res.headers.get('set-cookie')).toContain('session=;');
    expect(query).not.toHaveBeenCalled();
  });

  it('revokes the session id from a valid cookie', async () => {
    const { cookies } = await import('next/headers');
    const { createSessionToken } = await import('@/lib/auth');
    const token = await createSessionToken('user-1');
    vi.mocked(cookies).mockResolvedValue({ get: () => ({ value: token }) } as any);
    const { query } = await import('@/lib/db');
    vi.mocked(query).mockResolvedValueOnce([]); // revokeSession insert
    const { POST } = await import('@/app/api/auth/logout/route');

    const res = await POST();

    expect(res.status).toBe(200);
    expect(query).toHaveBeenCalledWith('insert into revoked_sessions (sid) values (?)', [
      expect.any(String),
    ]);
  });
});
