import { NextResponse } from 'next/server';
import { getCurrentUserId } from '@/lib/auth';
import { query } from '@/lib/db';
import { getStripeClient } from '@/lib/stripe';
import { SITE_URL } from '@/lib/site';

export async function POST() {
  if (process.env.ENABLE_STRIPE !== 'true') {
    return NextResponse.json({ error: 'Payments are not available yet.' }, { status: 503 });
  }

  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ error: 'Sign in first.' }, { status: 401 });
  }

  const priceId = process.env.STRIPE_PRICE_ID_MONTHLY;
  if (!priceId) {
    return NextResponse.json({ error: 'Billing is not configured yet.' }, { status: 500 });
  }

  const rows = await query<{ stripe_customer_id: string | null }>(
    'select stripe_customer_id from users where id = ?',
    [userId]
  );
  const existingCustomerId = rows[0]?.stripe_customer_id ?? undefined;

  const stripe = getStripeClient();
  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    line_items: [{ price: priceId, quantity: 1 }],
    // Belt-and-suspenders per §4.5: the webhook handler needs a reliable
    // way back to the internal user even if a customer record wasn't
    // pre-created.
    client_reference_id: userId,
    metadata: { userId },
    ...(existingCustomerId ? { customer: existingCustomerId } : {}),
    // §4.10 decision: enable Stripe Tax rather than handling tax manually.
    automatic_tax: { enabled: true },
    success_url: `${SITE_URL}/dashboard?upgraded=1`,
    cancel_url: `${SITE_URL}/dashboard/settings`,
  });

  return NextResponse.json({ url: session.url });
}
