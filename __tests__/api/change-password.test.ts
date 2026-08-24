import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/db', () => ({
  query: vi.fn(),
}));

vi.mock('@/lib/auth', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/auth')>();
  return { ...actual, getCurrentUserId: vi.fn() };
});

beforeEach(() => {
  vi.resetAllMocks();
});

function jsonRequest(body: unknown) {
  return new NextRequest('http://localhost/api/auth/change-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('POST /api/auth/change-password', () => {
  it('rejects when signed out', async () => {
    const { getCurrentUserId } = await import('@/lib/auth');
    vi.mocked(getCurrentUserId).mockResolvedValueOnce(null);
    const { POST } = await import('@/app/api/auth/change-password/route');

    const res = await POST(jsonRequest({ currentPassword: 'a', newPassword: 'longenough1' }));
    expect(res.status).toBe(401);
  });

  it('rejects a new password under 8 characters', async () => {
    const { getCurrentUserId } = await import('@/lib/auth');
    vi.mocked(getCurrentUserId).mockResolvedValueOnce('user-1');
    const { POST } = await import('@/app/api/auth/change-password/route');

    const res = await POST(jsonRequest({ currentPassword: 'a', newPassword: 'short' }));
    expect(res.status).toBe(400);
  });

  it('rejects an incorrect current password', async () => {
    const { getCurrentUserId, hashPassword } = await import('@/lib/auth');
    const { query } = await import('@/lib/db');
    vi.mocked(getCurrentUserId).mockResolvedValueOnce('user-1');
    vi.mocked(query).mockResolvedValueOnce([
      { password_hash: await hashPassword('actualpassword') },
    ]);
    const { POST } = await import('@/app/api/auth/change-password/route');

    const res = await POST(
      jsonRequest({ currentPassword: 'wrongpassword', newPassword: 'newlongpassword' })
    );
    expect(res.status).toBe(401);
  });

  it('updates the password hash on success', async () => {
    const { getCurrentUserId, hashPassword } = await import('@/lib/auth');
    const { query } = await import('@/lib/db');
    vi.mocked(getCurrentUserId).mockResolvedValueOnce('user-1');
    vi.mocked(query).mockResolvedValueOnce([
      { password_hash: await hashPassword('actualpassword') },
    ]);
    vi.mocked(query).mockResolvedValueOnce([]); // update statement
    const { POST } = await import('@/app/api/auth/change-password/route');

    const res = await POST(
      jsonRequest({ currentPassword: 'actualpassword', newPassword: 'newlongpassword' })
    );

    expect(res.status).toBe(200);
    expect(query).toHaveBeenLastCalledWith(
      'update users set password_hash = ? where id = ?',
      expect.arrayContaining(['user-1'])
    );
  });
});
