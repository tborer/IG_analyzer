import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/db', () => ({
  query: vi.fn(),
}));

vi.mock('@/lib/auth', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/auth')>();
  return { ...actual, getCurrentUserId: vi.fn() };
});

const createPortalSession = vi.fn();
vi.mock('@/lib/stripe', () => ({
  getStripeClient: () => ({ billingPortal: { sessions: { create: createPortalSession } } }),
}));

beforeEach(() => {
  vi.resetAllMocks();
});

describe('POST /api/billing/portal', () => {
  it('rejects when signed out', async () => {
    const { getCurrentUserId } = await import('@/lib/auth');
    vi.mocked(getCurrentUserId).mockResolvedValueOnce(null);
    const { POST } = await import('@/app/api/billing/portal/route');

    const res = await POST();
    expect(res.status).toBe(401);
  });

  it('returns a clear error, not a crash, for a user with no Stripe customer', async () => {
    const { getCurrentUserId } = await import('@/lib/auth');
    const { query } = await import('@/lib/db');
    vi.mocked(getCurrentUserId).mockResolvedValueOnce('user-1');
    vi.mocked(query).mockResolvedValueOnce([{ stripe_customer_id: null }]);
    const { POST } = await import('@/app/api/billing/portal/route');

    const res = await POST();
    expect(res.status).toBe(400);
    expect(createPortalSession).not.toHaveBeenCalled();
  });

  it('creates a portal session for a subscribed customer', async () => {
    const { getCurrentUserId } = await import('@/lib/auth');
    const { query } = await import('@/lib/db');
    vi.mocked(getCurrentUserId).mockResolvedValueOnce('user-1');
    vi.mocked(query).mockResolvedValueOnce([{ stripe_customer_id: 'cus_123' }]);
    createPortalSession.mockResolvedValueOnce({ url: 'https://billing.stripe.com/test-portal' });
    const { POST } = await import('@/app/api/billing/portal/route');

    const res = await POST();
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.url).toBe('https://billing.stripe.com/test-portal');
    expect(createPortalSession).toHaveBeenCalledWith(
      expect.objectContaining({ customer: 'cus_123' })
    );
  });
});
