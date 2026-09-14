import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/verification', () => ({
  verifyEmailToken: vi.fn(),
}));

beforeEach(() => {
  vi.resetAllMocks();
});

function jsonRequest(body: unknown) {
  return new NextRequest('http://localhost/api/auth/verify-email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('POST /api/auth/verify-email', () => {
  it('rejects a missing token', async () => {
    const { POST } = await import('@/app/api/auth/verify-email/route');
    const res = await POST(jsonRequest({}));
    expect(res.status).toBe(400);
  });

  it('rejects an invalid or expired token', async () => {
    const { verifyEmailToken } = await import('@/lib/verification');
    vi.mocked(verifyEmailToken).mockResolvedValueOnce('invalid_or_expired');
    const { POST } = await import('@/app/api/auth/verify-email/route');

    const res = await POST(jsonRequest({ token: 'bad' }));
    expect(res.status).toBe(400);
  });

  it('confirms a valid token', async () => {
    const { verifyEmailToken } = await import('@/lib/verification');
    vi.mocked(verifyEmailToken).mockResolvedValueOnce('ok');
    const { POST } = await import('@/app/api/auth/verify-email/route');

    const res = await POST(jsonRequest({ token: 'good' }));
    expect(res.status).toBe(200);
  });
});
