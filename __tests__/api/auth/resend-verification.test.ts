import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/db', () => ({
  query: vi.fn(),
}));

vi.mock('@/lib/auth', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/auth')>();
  return { ...actual, getCurrentUserId: vi.fn() };
});

vi.mock('@/lib/verification', () => ({
  sendVerificationEmail: vi.fn(),
}));

beforeEach(() => {
  vi.resetAllMocks();
  process.env.ENABLE_EMAIL_VERIFICATION = 'true';
});

describe('POST /api/auth/resend-verification', () => {
  it('returns 404 when email verification is disabled', async () => {
    delete process.env.ENABLE_EMAIL_VERIFICATION;
    const { POST } = await import('@/app/api/auth/resend-verification/route');

    const res = await POST();
    expect(res.status).toBe(404);
  });

  it('rejects when signed out', async () => {
    const { getCurrentUserId } = await import('@/lib/auth');
    vi.mocked(getCurrentUserId).mockResolvedValueOnce(null);
    const { POST } = await import('@/app/api/auth/resend-verification/route');

    const res = await POST();
    expect(res.status).toBe(401);
  });

  it('reports already-verified without resending', async () => {
    const { getCurrentUserId } = await import('@/lib/auth');
    const { query } = await import('@/lib/db');
    const { sendVerificationEmail } = await import('@/lib/verification');
    vi.mocked(getCurrentUserId).mockResolvedValueOnce('user-1');
    vi.mocked(query).mockResolvedValueOnce([
      { email: 'user@example.com', email_verified_at: '2026-01-01 00:00:00' },
    ]);
    const { POST } = await import('@/app/api/auth/resend-verification/route');

    const res = await POST();
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.alreadyVerified).toBe(true);
    expect(sendVerificationEmail).not.toHaveBeenCalled();
  });

  it('resends when unverified', async () => {
    const { getCurrentUserId } = await import('@/lib/auth');
    const { query } = await import('@/lib/db');
    const { sendVerificationEmail } = await import('@/lib/verification');
    vi.mocked(getCurrentUserId).mockResolvedValueOnce('user-1');
    vi.mocked(query).mockResolvedValueOnce([
      { email: 'user@example.com', email_verified_at: null },
    ]);
    const { POST } = await import('@/app/api/auth/resend-verification/route');

    const res = await POST();

    expect(res.status).toBe(200);
    expect(sendVerificationEmail).toHaveBeenCalledWith('user-1', 'user@example.com');
  });
});
