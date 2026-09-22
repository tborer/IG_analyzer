import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/db', () => ({
  query: vi.fn(),
}));

const constructEvent = vi.fn();
vi.mock('@/lib/stripe', () => ({
  getStripeClient: () => ({ webhooks: { constructEvent } }),
}));

beforeAll(() => {
  process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test_secret';
});

beforeEach(() => {
  vi.resetAllMocks();
});

function request(body = '{}') {
  return new NextRequest('http://localhost/api/webhooks/stripe', {
    method: 'POST',
    headers: { 'stripe-signature': 'sig_doesnt_matter_constructEvent_is_mocked' },
    body,
  });
}

describe('POST /api/webhooks/stripe -- idempotency', () => {
  it('processes a new event once', async () => {
    const { query } = await import('@/lib/db');
    constructEvent.mockReturnValueOnce({
      id: 'evt_1',
      type: 'customer.subscription.deleted',
      data: { object: { customer: 'cus_1' } },
    });
    vi.mocked(query).mockResolvedValueOnce([]); // claim insert succeeds
    vi.mocked(query).mockResolvedValueOnce([]); // update users
    const { POST } = await import('@/app/api/webhooks/stripe/route');

    const res = await POST(request());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.duplicate).toBeUndefined();
    expect(query).toHaveBeenCalledWith(
      'update users set subscription_status = ?, token_allotment = ?, token_period_start = ? where stripe_customer_id = ?',
      ['canceled', 0, expect.any(String), 'cus_1']
    );
  });

  it('does not reprocess an event whose id was already claimed', async () => {
    const { query } = await import('@/lib/db');
    constructEvent.mockReturnValueOnce({
      id: 'evt_1',
      type: 'customer.subscription.deleted',
      data: { object: { customer: 'cus_1' } },
    });
    vi.mocked(query).mockRejectedValueOnce(
      Object.assign(new Error('UNIQUE constraint failed'), { code: 'SQLITE_CONSTRAINT_PRIMARYKEY' })
    );
    const { POST } = await import('@/app/api/webhooks/stripe/route');

    const res = await POST(request());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.duplicate).toBe(true);
    // Only the (failed) claim insert happened -- no subscription update.
    expect(query).toHaveBeenCalledTimes(1);
  });

  it('returns 500 on a genuine DB error rather than silently treating it as a duplicate', async () => {
    const { query } = await import('@/lib/db');
    constructEvent.mockReturnValueOnce({
      id: 'evt_1',
      type: 'customer.subscription.deleted',
      data: { object: { customer: 'cus_1' } },
    });
    vi.mocked(query).mockRejectedValueOnce(new Error('connection refused'));
    const { POST } = await import('@/app/api/webhooks/stripe/route');

    // No try/catch in the route for this path -- it propagates, and Next
    // turns an uncaught throw into a 500 response; called directly here
    // (bypassing that framework layer), it surfaces as a rejected promise.
    await expect(POST(request())).rejects.toThrow('connection refused');
  });
});

describe('POST /api/webhooks/stripe -- event handling', () => {
  it('checkout.session.completed stores the customer/subscription ids and activates the plan', async () => {
    const { query } = await import('@/lib/db');
    constructEvent.mockReturnValueOnce({
      id: 'evt_checkout',
      type: 'checkout.session.completed',
      data: {
        object: {
          client_reference_id: 'user-1',
          metadata: { userId: 'user-1' },
          customer: 'cus_1',
          subscription: 'sub_1',
        },
      },
    });
    vi.mocked(query).mockResolvedValueOnce([]); // claim
    vi.mocked(query).mockResolvedValueOnce([]); // update
    const { POST } = await import('@/app/api/webhooks/stripe/route');

    await POST(request());

    expect(query).toHaveBeenCalledWith(
      'update users set stripe_customer_id = ?, stripe_subscription_id = ?, subscription_status = ?, token_allotment = ?, token_period_start = ? where id = ?',
      ['cus_1', 'sub_1', 'active', 20, expect.any(String), 'user-1']
    );
  });

  it('invoice.payment_succeeded resets the token allotment for the new period', async () => {
    const { query } = await import('@/lib/db');
    constructEvent.mockReturnValueOnce({
      id: 'evt_invoice_succeeded',
      type: 'invoice.payment_succeeded',
      data: { object: { customer: 'cus_1' } },
    });
    vi.mocked(query).mockResolvedValueOnce([]); // claim
    vi.mocked(query).mockResolvedValueOnce([]); // update
    const { POST } = await import('@/app/api/webhooks/stripe/route');

    await POST(request());

    expect(query).toHaveBeenCalledWith(
      'update users set token_allotment = ?, token_period_start = ? where stripe_customer_id = ?',
      [20, expect.any(String), 'cus_1']
    );
  });

  it('customer.subscription.updated syncs status and current_period_end from the subscription item', async () => {
    const { query } = await import('@/lib/db');
    const periodEndUnix = 1_800_000_000; // arbitrary fixed timestamp
    constructEvent.mockReturnValueOnce({
      id: 'evt_updated',
      type: 'customer.subscription.updated',
      data: {
        object: {
          customer: 'cus_1',
          status: 'active',
          items: { data: [{ current_period_end: periodEndUnix }] },
        },
      },
    });
    vi.mocked(query).mockResolvedValueOnce([]); // claim
    vi.mocked(query).mockResolvedValueOnce([]); // update
    const { POST } = await import('@/app/api/webhooks/stripe/route');

    await POST(request());

    expect(query).toHaveBeenCalledWith(
      'update users set subscription_status = ?, current_period_end = ? where stripe_customer_id = ?',
      ['active', new Date(periodEndUnix * 1000).toISOString(), 'cus_1']
    );
  });

  it('invoice.payment_failed marks the subscription past_due', async () => {
    const { query } = await import('@/lib/db');
    constructEvent.mockReturnValueOnce({
      id: 'evt_failed',
      type: 'invoice.payment_failed',
      data: { object: { customer: 'cus_1' } },
    });
    vi.mocked(query).mockResolvedValueOnce([]); // claim
    vi.mocked(query).mockResolvedValueOnce([]); // update
    const { POST } = await import('@/app/api/webhooks/stripe/route');

    await POST(request());

    expect(query).toHaveBeenCalledWith('update users set subscription_status = ? where stripe_customer_id = ?', [
      'past_due',
      'cus_1',
    ]);
  });

  it('ignores an unhandled event type without erroring', async () => {
    const { query } = await import('@/lib/db');
    constructEvent.mockReturnValueOnce({ id: 'evt_other', type: 'customer.created', data: { object: {} } });
    vi.mocked(query).mockResolvedValueOnce([]); // claim
    const { POST } = await import('@/app/api/webhooks/stripe/route');

    const res = await POST(request());
    expect(res.status).toBe(200);
  });
});
