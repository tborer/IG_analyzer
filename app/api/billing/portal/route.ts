import { NextResponse } from 'next/server';
import { getCurrentUserId } from '@/lib/auth';
import { query } from '@/lib/db';
import { getStripeClient } from '@/lib/stripe';
import { SITE_URL } from '@/lib/site';

export async function POST() {
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ error: 'Sign in first.' }, { status: 401 });
  }

  const rows = await query<{ stripe_customer_id: string | null }>(
    'select stripe_customer_id from users where id = ?',
    [userId]
  );
  const customerId = rows[0]?.stripe_customer_id;
  if (!customerId) {
    return NextResponse.json(
      { error: 'No billing account yet — subscribe first.' },
      { status: 400 }
    );
  }

  const stripe = getStripeClient();
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${SITE_URL}/dashboard/settings`,
  });

  return NextResponse.json({ url: session.url });
}
