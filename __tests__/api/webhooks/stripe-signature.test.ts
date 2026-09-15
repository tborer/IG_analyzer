import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import Stripe from 'stripe';

// Real signature verification, per §3.6's explicit ask ("test with an
// intentionally wrong secret") -- constructEvent/generateTestHeaderString
// are pure local crypto, no network call, so this doesn't need a real
// Stripe account. Only @/lib/db is mocked; @/lib/stripe uses the real SDK.
vi.mock('@/lib/db', () => ({
  query: vi.fn(),
}));

const WEBHOOK_SECRET = 'whsec_test_secret';
const stripe = new Stripe('sk_test_dummy_key_not_a_real_key');

beforeAll(() => {
  process.env.STRIPE_SECRET_KEY = 'sk_test_dummy_key_not_a_real_key';
  process.env.STRIPE_WEBHOOK_SECRET = WEBHOOK_SECRET;
});

beforeEach(() => {
  vi.resetAllMocks();
});

function fixturePayload() {
  return JSON.stringify({
    id: 'evt_test_1',
    object: 'event',
    type: 'checkout.session.completed',
    data: { object: { id: 'cs_test_1', client_reference_id: 'user-1', customer: 'cus_1', subscription: 'sub_1' } },
  });
}

function request(body: string, signature: string) {
  return new NextRequest('http://localhost/api/webhooks/stripe', {
    method: 'POST',
    headers: { 'stripe-signature': signature },
    body,
  });
}

describe('POST /api/webhooks/stripe -- signature verification', () => {
  it('accepts a validly signed payload', async () => {
    const { query } = await import('@/lib/db');
    vi.mocked(query).mockResolvedValueOnce([]); // claim insert
    vi.mocked(query).mockResolvedValueOnce([]); // update users
    const payload = fixturePayload();
    const signature = stripe.webhooks.generateTestHeaderString({ payload, secret: WEBHOOK_SECRET });
    const { POST } = await import('@/app/api/webhooks/stripe/route');

    const res = await POST(request(payload, signature));

    expect(res.status).toBe(200);
  });

  it('rejects a payload signed with the wrong secret', async () => {
    const payload = fixturePayload();
    const signature = stripe.webhooks.generateTestHeaderString({
      payload,
      secret: 'whsec_a_completely_different_secret',
    });
    const { POST } = await import('@/app/api/webhooks/stripe/route');

    const res = await POST(request(payload, signature));

    expect(res.status).toBe(400);
  });

  it('rejects a tampered payload even with a validly-formatted signature for the original body', async () => {
    const originalPayload = fixturePayload();
    const signature = stripe.webhooks.generateTestHeaderString({
      payload: originalPayload,
      secret: WEBHOOK_SECRET,
    });
    const tamperedPayload = originalPayload.replace('user-1', 'attacker-controlled-user');
    const { POST } = await import('@/app/api/webhooks/stripe/route');

    const res = await POST(request(tamperedPayload, signature));

    expect(res.status).toBe(400);
  });

  it('rejects a request with no signature header at all', async () => {
    const { POST } = await import('@/app/api/webhooks/stripe/route');
    const req = new NextRequest('http://localhost/api/webhooks/stripe', {
      method: 'POST',
      body: fixturePayload(),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
  });
});
