import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/db', () => ({
  query: vi.fn(),
}));

vi.mock('@/lib/login-rate-limit', () => ({
  recordLoginAttempt: vi.fn(),
  isLockedOut: vi.fn().mockResolvedValue(false),
}));

beforeAll(() => {
  process.env.SESSION_SECRET = 'test-secret-do-not-use-in-production';
});

beforeEach(() => {
  vi.resetAllMocks();
});

function jsonRequest(url: string, body: unknown) {
  return new NextRequest(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('POST /api/auth/signup', () => {
  it('rejects an invalid email/password before touching the database', async () => {
    const { query } = await import('@/lib/db');
    const { POST } = await import('@/app/api/auth/signup/route');

    const res = await POST(
      jsonRequest('http://localhost/api/auth/signup', { email: 'not-an-email', password: 'short' })
    );

    expect(res.status).toBe(400);
    expect(query).not.toHaveBeenCalled();
  });

  it('rejects a duplicate email with 409', async () => {
    const { query } = await import('@/lib/db');
    vi.mocked(query).mockResolvedValueOnce([{ id: 'existing-user' }]);
    const { POST } = await import('@/app/api/auth/signup/route');

    const res = await POST(
      jsonRequest('http://localhost/api/auth/signup', {
        email: 'taken@example.com',
        password: 'longenoughpassword',
      })
    );

    expect(res.status).toBe(409);
  });

  it('creates a user and sets a session cookie on success', async () => {
    const { query } = await import('@/lib/db');
    vi.mocked(query).mockResolvedValueOnce([]); // no existing user
    vi.mocked(query).mockResolvedValueOnce([]); // insert user
    vi.mocked(query).mockResolvedValueOnce([]); // insert verification token (fire-and-forget)
    const { POST } = await import('@/app/api/auth/signup/route');

    const res = await POST(
      jsonRequest('http://localhost/api/auth/signup', {
        email: 'new@example.com',
        password: 'longenoughpassword',
      })
    );

    expect(res.status).toBe(200);
    expect(res.cookies.get('session')?.value).toBeTruthy();
    expect(query).toHaveBeenCalledWith(
      'insert into users (id, email, password_hash, token_allotment, token_period_start) values (?, ?, ?, ?, ?)',
      expect.arrayContaining(['new@example.com', 1])
    );
  });
});

describe('POST /api/auth/login', () => {
  it('rejects an unknown email with 401 (no user enumeration in the response)', async () => {
    const { query } = await import('@/lib/db');
    vi.mocked(query).mockResolvedValueOnce([]);
    const { POST } = await import('@/app/api/auth/login/route');

    const res = await POST(
      jsonRequest('http://localhost/api/auth/login', {
        email: 'nobody@example.com',
        password: 'whatever123',
      })
    );

    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe('Incorrect email or password.');
  });

  it('rejects a wrong password with the same generic 401', async () => {
    const { query } = await import('@/lib/db');
    const { hashPassword } = await import('@/lib/auth');
    vi.mocked(query).mockResolvedValueOnce([
      { id: 'user-1', password_hash: await hashPassword('correctpassword') },
    ]);
    const { POST } = await import('@/app/api/auth/login/route');

    const res = await POST(
      jsonRequest('http://localhost/api/auth/login', {
        email: 'user@example.com',
        password: 'wrongpassword',
      })
    );

    expect(res.status).toBe(401);
  });

  it('logs in and sets a session cookie on a correct password', async () => {
    const { query } = await import('@/lib/db');
    const { hashPassword } = await import('@/lib/auth');
    vi.mocked(query).mockResolvedValueOnce([
      { id: 'user-1', password_hash: await hashPassword('correctpassword') },
    ]);
    const { POST } = await import('@/app/api/auth/login/route');

    const res = await POST(
      jsonRequest('http://localhost/api/auth/login', {
        email: 'user@example.com',
        password: 'correctpassword',
      })
    );

    expect(res.status).toBe(200);
    expect(res.cookies.get('session')?.value).toBeTruthy();
  });
});
