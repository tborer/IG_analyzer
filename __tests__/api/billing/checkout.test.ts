import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/db', () => ({
  query: vi.fn(),
}));

vi.mock('@/lib/auth', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/auth')>();
  return { ...actual, getCurrentUserId: vi.fn() };
});

const createSession = vi.fn();
vi.mock('@/lib/stripe', () => ({
  getStripeClient: () => ({ checkout: { sessions: { create: createSession } } }),
}));

beforeEach(() => {
  vi.resetAllMocks();
  process.env.STRIPE_PRICE_ID_MONTHLY = 'price_test_123';
  process.env.ENABLE_STRIPE = 'true';
});

describe('POST /api/billing/checkout', () => {
  it('refuses when payments are not enabled', async () => {
    process.env.ENABLE_STRIPE = 'false';
    const { POST } = await import('@/app/api/billing/checkout/route');

    const res = await POST();
    expect(res.status).toBe(503);
    expect(createSession).not.toHaveBeenCalled();
  });

  it('rejects when signed out', async () => {
    const { getCurrentUserId } = await import('@/lib/auth');
    vi.mocked(getCurrentUserId).mockResolvedValueOnce(null);
    const { POST } = await import('@/app/api/billing/checkout/route');

    const res = await POST();
    expect(res.status).toBe(401);
    expect(createSession).not.toHaveBeenCalled();
  });

  it('returns 500 when no price id is configured', async () => {
    delete process.env.STRIPE_PRICE_ID_MONTHLY;
    const { getCurrentUserId } = await import('@/lib/auth');
    vi.mocked(getCurrentUserId).mockResolvedValueOnce('user-1');
    const { POST } = await import('@/app/api/billing/checkout/route');

    const res = await POST();
    expect(res.status).toBe(500);
  });

  it('creates a subscription-mode session with the right price and user reference', async () => {
    const { getCurrentUserId } = await import('@/lib/auth');
    const { query } = await import('@/lib/db');
    vi.mocked(getCurrentUserId).mockResolvedValueOnce('user-1');
    vi.mocked(query).mockResolvedValueOnce([{ stripe_customer_id: null }]);
    createSession.mockResolvedValueOnce({ url: 'https://checkout.stripe.com/test-session' });
    const { POST } = await import('@/app/api/billing/checkout/route');

    const res = await POST();
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.url).toBe('https://checkout.stripe.com/test-session');
    expect(createSession).toHaveBeenCalledWith(
      expect.objectContaining({
        mode: 'subscription',
        line_items: [{ price: 'price_test_123', quantity: 1 }],
        client_reference_id: 'user-1',
        metadata: { userId: 'user-1' },
        automatic_tax: { enabled: true },
      })
    );
    expect(createSession.mock.calls[0][0]).not.toHaveProperty('customer');
  });

  it('reuses an existing Stripe customer id for a returning customer', async () => {
    const { getCurrentUserId } = await import('@/lib/auth');
    const { query } = await import('@/lib/db');
    vi.mocked(getCurrentUserId).mockResolvedValueOnce('user-1');
    vi.mocked(query).mockResolvedValueOnce([{ stripe_customer_id: 'cus_existing' }]);
    createSession.mockResolvedValueOnce({ url: 'https://checkout.stripe.com/test-session' });
    const { POST } = await import('@/app/api/billing/checkout/route');

    await POST();

    expect(createSession).toHaveBeenCalledWith(
      expect.objectContaining({ customer: 'cus_existing' })
    );
  });
});
