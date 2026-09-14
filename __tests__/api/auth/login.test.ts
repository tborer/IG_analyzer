import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/db', () => ({
  query: vi.fn(),
}));

vi.mock('@/lib/auth', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/auth')>();
  return { ...actual, getCurrentUserId: vi.fn(), verifyPassword: vi.fn() };
});

vi.mock('@/lib/login-rate-limit', () => ({
  recordLoginAttempt: vi.fn(),
  isLockedOut: vi.fn(),
}));

beforeAll(() => {
  process.env.SESSION_SECRET = 'test-secret-do-not-use-in-production';
});

beforeEach(() => {
  vi.resetAllMocks();
});

function jsonRequest(body: unknown) {
  return new NextRequest('http://localhost/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('POST /api/auth/login', () => {
  it('rejects when email or password is missing', async () => {
    const { POST } = await import('@/app/api/auth/login/route');

    const res = await POST(jsonRequest({ email: 'user@example.com' }));
    expect(res.status).toBe(400);
  });

  it('rejects when email is not found', async () => {
    const { query } = await import('@/lib/db');
    const { isLockedOut } = await import('@/lib/login-rate-limit');
    vi.mocked(isLockedOut).mockResolvedValueOnce(false);
    vi.mocked(query).mockResolvedValueOnce([]);
    const { POST } = await import('@/app/api/auth/login/route');

    const res = await POST(jsonRequest({ email: 'user@example.com', password: 'password' }));
    expect(res.status).toBe(401);
  });

  it('rejects when password is incorrect', async () => {
    const { query } = await import('@/lib/db');
    const { verifyPassword } = await import('@/lib/auth');
    const { isLockedOut } = await import('@/lib/login-rate-limit');
    vi.mocked(isLockedOut).mockResolvedValueOnce(false);
    vi.mocked(query).mockResolvedValueOnce([{ id: 'user-1', password_hash: 'hash' }]);
    vi.mocked(verifyPassword).mockResolvedValueOnce(false);
    const { POST } = await import('@/app/api/auth/login/route');

    const res = await POST(jsonRequest({ email: 'user@example.com', password: 'wrongpassword' }));
    expect(res.status).toBe(401);
  });

  it('successfully logs in', async () => {
    const { query } = await import('@/lib/db');
    const { verifyPassword } = await import('@/lib/auth');
    const { isLockedOut } = await import('@/lib/login-rate-limit');
    vi.mocked(isLockedOut).mockResolvedValueOnce(false);
    vi.mocked(query).mockResolvedValueOnce([{ id: 'user-1', password_hash: 'hash' }]);
    vi.mocked(verifyPassword).mockResolvedValueOnce(true);
    const { POST } = await import('@/app/api/auth/login/route');

    const res = await POST(jsonRequest({ email: 'user@example.com', password: 'correctpassword' }));
    expect(res.status).toBe(200);
  });

  it('returns 429 when email is locked out', async () => {
    const { isLockedOut } = await import('@/lib/login-rate-limit');
    vi.mocked(isLockedOut).mockResolvedValueOnce(true);
    const { POST } = await import('@/app/api/auth/login/route');

    const res = await POST(jsonRequest({ email: 'user@example.com', password: 'password' }));
    expect(res.status).toBe(429);
  });

  it('records failed attempts', async () => {
    const { query } = await import('@/lib/db');
    const { verifyPassword } = await import('@/lib/auth');
    const { isLockedOut, recordLoginAttempt } = await import('@/lib/login-rate-limit');
    vi.mocked(isLockedOut).mockResolvedValueOnce(false);
    vi.mocked(query).mockResolvedValueOnce([{ id: 'user-1', password_hash: 'hash' }]);
    vi.mocked(verifyPassword).mockResolvedValueOnce(false);
    const { POST } = await import('@/app/api/auth/login/route');

    await POST(jsonRequest({ email: 'user@example.com', password: 'wrongpassword' }));
    expect(vi.mocked(recordLoginAttempt)).toHaveBeenCalledWith('user@example.com', 'unknown', 0);
  });

  it('records successful attempts', async () => {
    const { query } = await import('@/lib/db');
    const { verifyPassword } = await import('@/lib/auth');
    const { isLockedOut, recordLoginAttempt } = await import('@/lib/login-rate-limit');
    vi.mocked(isLockedOut).mockResolvedValueOnce(false);
    vi.mocked(query).mockResolvedValueOnce([{ id: 'user-1', password_hash: 'hash' }]);
    vi.mocked(verifyPassword).mockResolvedValueOnce(true);
    const { POST } = await import('@/app/api/auth/login/route');

    await POST(jsonRequest({ email: 'user@example.com', password: 'correctpassword' }));
    expect(vi.mocked(recordLoginAttempt)).toHaveBeenCalledWith('user@example.com', 'unknown', 1);
  });
});
