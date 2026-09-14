import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/password-reset', () => ({
  requestPasswordReset: vi.fn(),
}));

beforeEach(() => {
  vi.resetAllMocks();
});

function jsonRequest(body: unknown) {
  return new NextRequest('http://localhost/api/auth/forgot-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('POST /api/auth/forgot-password', () => {
  it('returns the same generic 200 for an unknown email', async () => {
    const { requestPasswordReset } = await import('@/lib/password-reset');
    const { POST } = await import('@/app/api/auth/forgot-password/route');

    const res = await POST(jsonRequest({ email: 'nobody@example.com' }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.message).toMatch(/if that email is registered/i);
    expect(requestPasswordReset).toHaveBeenCalledWith('nobody@example.com');
  });

  it('returns the same generic 200 even with a missing email (no crash, no leak)', async () => {
    const { requestPasswordReset } = await import('@/lib/password-reset');
    const { POST } = await import('@/app/api/auth/forgot-password/route');

    const res = await POST(jsonRequest({}));

    expect(res.status).toBe(200);
    expect(requestPasswordReset).not.toHaveBeenCalled();
  });

  it('normalizes the email before passing it on', async () => {
    const { requestPasswordReset } = await import('@/lib/password-reset');
    const { POST } = await import('@/app/api/auth/forgot-password/route');

    await POST(jsonRequest({ email: '  User@Example.com  ' }));

    expect(requestPasswordReset).toHaveBeenCalledWith('user@example.com');
  });
});
