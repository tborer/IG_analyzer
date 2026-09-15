import Stripe from 'stripe';

let client: Stripe | undefined;

// Created lazily on first use, not at module load -- same reasoning as
// lib/db.ts: importing this file (e.g. during `next build`'s page-data
// collection) must never throw just because STRIPE_SECRET_KEY isn't set.
export function getStripeClient(): Stripe {
  if (!client) {
    const apiKey = process.env.STRIPE_SECRET_KEY;
    if (!apiKey) {
      throw new Error('STRIPE_SECRET_KEY is not set. Add it to your environment.');
    }
    client = new Stripe(apiKey);
  }
  return client;
}
