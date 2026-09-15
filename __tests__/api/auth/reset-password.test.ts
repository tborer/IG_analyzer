import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/db', () => ({
  query: vi.fn(),
}));

vi.mock('@/lib/password-reset', () => ({
  resetPassword: vi.fn(),
}));

beforeAll(() => {
  process.env.SESSION_SECRET = 'test-secret-do-not-use-in-production';
});

beforeEach(() => {
  vi.resetAllMocks();
});

function jsonRequest(body: unknown) {
  return new NextRequest('http://localhost/api/auth/reset-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('POST /api/auth/reset-password', () => {
  it('rejects a missing token or password', async () => {
    const { POST } = await import('@/app/api/auth/reset-password/route');
    const res = await POST(jsonRequest({ password: 'longenoughpassword' }));
    expect(res.status).toBe(400);
  });

  it('rejects a short new password', async () => {
    const { POST } = await import('@/app/api/auth/reset-password/route');
    const res = await POST(jsonRequest({ token: 'abc', password: 'short' }));
    expect(res.status).toBe(400);
  });

  it('rejects an invalid or expired token', async () => {
    const { resetPassword } = await import('@/lib/password-reset');
    vi.mocked(resetPassword).mockResolvedValueOnce({ result: 'invalid_or_expired' });
    const { POST } = await import('@/app/api/auth/reset-password/route');

    const res = await POST(jsonRequest({ token: 'bad', password: 'longenoughpassword' }));

    expect(res.status).toBe(400);
  });

  it('updates the password and invalidates other sessions on success', async () => {
    const { resetPassword } = await import('@/lib/password-reset');
    const { query } = await import('@/lib/db');
    vi.mocked(resetPassword).mockResolvedValueOnce({ result: 'ok', userId: 'user-1' });
    vi.mocked(query).mockResolvedValueOnce([]); // invalidateOtherSessions
    const { POST } = await import('@/app/api/auth/reset-password/route');

    const res = await POST(jsonRequest({ token: 'good', password: 'longenoughpassword' }));

    expect(res.status).toBe(200);
    expect(query).toHaveBeenCalledWith(
      "update users set sessions_invalidated_at = datetime('now') where id = ?",
      ['user-1']
    );
  });
});
