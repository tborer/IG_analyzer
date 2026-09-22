import { NextRequest, NextResponse } from 'next/server';
import type Stripe from 'stripe';
import { getStripeClient } from '@/lib/stripe';
import { query } from '@/lib/db';
import { PAID_TOKEN_ALLOTMENT } from '@/lib/rate-limit';

function customerIdOf(customer: string | { id: string } | null): string | null {
  if (!customer) return null;
  return typeof customer === 'string' ? customer : customer.id;
}

/**
 * Claims this event id for processing. Returns false if it's already been
 * processed (a duplicate delivery) -- relies on processed_stripe_events'
 * PRIMARY KEY to make the claim atomic without needing an explicit
 * transaction. Any other DB error propagates so the caller can 500 and let
 * Stripe retry, rather than being silently treated as a duplicate.
 */
async function claimEvent(eventId: string): Promise<boolean> {
  try {
    await query('insert into processed_stripe_events (event_id) values (?)', [eventId]);
    return true;
  } catch (err) {
    if ((err as { code?: string }).code?.startsWith('SQLITE_CONSTRAINT')) {
      return false;
    }
    throw err;
  }
}

export async function POST(req: NextRequest) {
  const signature = req.headers.get('stripe-signature');
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!signature || !webhookSecret) {
    return NextResponse.json({ error: 'Webhook not configured.' }, { status: 400 });
  }

  // Signature verification needs the exact raw bytes Stripe signed --
  // req.text() gives that; req.json() would re-serialize and break it.
  const rawBody = await req.text();
  const stripe = getStripeClient();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err) {
    console.error('Stripe webhook signature verification failed:', err);
    return NextResponse.json({ error: 'Invalid signature.' }, { status: 400 });
  }

  const isNewEvent = await claimEvent(event.id);
  if (!isNewEvent) {
    return NextResponse.json({ received: true, duplicate: true });
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.client_reference_id || session.metadata?.userId;
      const customerId = customerIdOf(session.customer);
      const subscriptionId =
        typeof session.subscription === 'string' ? session.subscription : (session.subscription?.id ?? null);
      if (userId && customerId) {
        await query(
          'update users set stripe_customer_id = ?, stripe_subscription_id = ?, subscription_status = ?, token_allotment = ?, token_period_start = ? where id = ?',
          [customerId, subscriptionId, 'active', PAID_TOKEN_ALLOTMENT, new Date().toISOString(), userId]
        );
      } else {
        console.error('checkout.session.completed missing userId or customerId', event.id);
      }
      break;
    }

    case 'customer.subscription.updated': {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId = customerIdOf(subscription.customer);
      const periodEndSeconds = subscription.items.data[0]?.current_period_end;
      const currentPeriodEnd = periodEndSeconds ? new Date(periodEndSeconds * 1000).toISOString() : null;
      if (customerId) {
        await query(
          'update users set subscription_status = ?, current_period_end = ? where stripe_customer_id = ?',
          [subscription.status, currentPeriodEnd, customerId]
        );
      }
      break;
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId = customerIdOf(subscription.customer);
      if (customerId) {
        // This event fires once the subscription has actually ended (not
        // when a cancellation is merely scheduled), so the current period
        // is genuinely over -- revoke the paid token allotment now rather
        // than leaving a stale balance around.
        await query(
          'update users set subscription_status = ?, token_allotment = ?, token_period_start = ? where stripe_customer_id = ?',
          ['canceled', 0, new Date().toISOString(), customerId]
        );
      }
      break;
    }

    case 'invoice.payment_succeeded': {
      const invoice = event.data.object as Stripe.Invoice;
      const customerId = customerIdOf(invoice.customer);
      if (customerId) {
        // This app only ever creates subscription-mode Checkout Sessions
        // (see app/api/billing/checkout/route.ts), so every invoice here
        // is a subscription invoice -- safe to reset the token allotment
        // unconditionally. Also fires for the very first invoice of a new
        // subscription, redundantly with checkout.session.completed above
        // -- harmless, both set the same values.
        await query(
          'update users set token_allotment = ?, token_period_start = ? where stripe_customer_id = ?',
          [PAID_TOKEN_ALLOTMENT, new Date().toISOString(), customerId]
        );
      }
      break;
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice;
      const customerId = customerIdOf(invoice.customer);
      if (customerId) {
        await query('update users set subscription_status = ? where stripe_customer_id = ?', [
          'past_due',
          customerId,
        ]);
        // Email notification is optional per §4.5 until §1.5's provider is
        // wired up for this specific case -- surfaced for manual follow-up
        // rather than swallowed.
        console.warn(`Payment failed for Stripe customer ${customerId} -- subscription_status set to past_due.`);
      }
      break;
    }

    default:
      break;
  }

  return NextResponse.json({ received: true });
}
