'use client';

import { useState } from 'react';
import { PAID_PLAN_PRICE } from '@/lib/site';

export default function BillingSection({
  effectivePlan,
  subscriptionStatus,
  currentPeriodEnd,
  hasStripeCustomer,
  stripeEnabled,
  tokenBalance,
  tokenAllotment,
}: {
  effectivePlan: 'free' | 'paid';
  subscriptionStatus: string | null;
  currentPeriodEnd: string | null;
  hasStripeCustomer: boolean;
  stripeEnabled: boolean;
  // Omit both to skip the display entirely (e.g. existing callers that
  // don't pass them).
  tokenBalance?: number;
  tokenAllotment?: number;
}) {
  const [loading, setLoading] = useState<'checkout' | 'portal' | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function go(endpoint: string, key: 'checkout' | 'portal') {
    setError(null);
    setLoading(key);
    try {
      const res = await fetch(endpoint, { method: 'POST' });
      const body = await res.json().catch(() => ({}));
      if (!res.ok || !body.url) throw new Error(body.error || 'Something went wrong.');
      window.location.href = body.url;
    } catch (err) {
      setError((err as Error).message);
      setLoading(null);
    }
  }

  return (
    <div className="border border-hair rounded-lg bg-inkraised p-6 mb-10 max-w-sm">
      <p className="eyebrow text-mist mb-2">Plan</p>
      <p className="font-display text-lg mb-1">{effectivePlan === 'paid' ? 'Paid' : 'Free'}</p>

      {typeof tokenAllotment === 'number' && typeof tokenBalance === 'number' && (
        <p className="text-sm text-bone/70 mb-1">
          {tokenBalance} of {tokenAllotment} audits remaining this period
        </p>
      )}

      {subscriptionStatus === 'past_due' && (
        <p className="text-sm text-signal mb-4">
          Payment issue — update your card to keep your paid plan active.
        </p>
      )}
      {effectivePlan === 'paid' && subscriptionStatus === 'active' && currentPeriodEnd && (
        <p className="text-sm text-bone/70 mb-4">
          Renews {new Date(currentPeriodEnd).toLocaleDateString()}
        </p>
      )}

      {error && <p className="text-sm text-signal mb-3">{error}</p>}

      {!hasStripeCustomer ? (
        stripeEnabled ? (
          <>
            <p className="text-sm text-bone/70 mb-3">${PAID_PLAN_PRICE}/mo — 20 audits/month</p>
            <button
              onClick={() => go('/api/billing/checkout', 'checkout')}
              disabled={loading !== null}
              className="px-5 py-2.5 bg-brass text-ink font-medium rounded-lg hover:bg-brass/90 disabled:opacity-50 transition-colors"
            >
              {loading === 'checkout' ? 'Redirecting…' : 'Upgrade'}
            </button>
          </>
        ) : (
          <p className="text-sm text-mist">Payments aren&apos;t available yet — check back soon.</p>
        )
      ) : (
        <button
          onClick={() => go('/api/billing/portal', 'portal')}
          disabled={loading !== null}
          className="px-5 py-2.5 border border-hair rounded-lg hover:border-brass/50 disabled:opacity-50 transition-colors"
        >
          {loading === 'portal' ? 'Redirecting…' : 'Manage billing'}
        </button>
      )}
    </div>
  );
}
