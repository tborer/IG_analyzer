import { query } from './db';

// Token model (2026-09-21, replacing the old flat daily cap): a signed-up
// user gets a one-time free token; a paid subscriber's token_allotment
// resets to this value on every successful Stripe invoice (checkout or
// renewal) -- see app/api/webhooks/stripe/route.ts.
export const PAID_TOKEN_ALLOTMENT = 20;
export const FREE_TOKEN_GRANT = 1;

// Abuse guard, independent of token balance -- caps how fast a balance can
// be spent in one day regardless of how many tokens remain, so a
// compromised or scripted account can't burn a whole period's allotment
// (or run up API cost) in one burst.
const DAILY_ABUSE_CAP = 10;

// §4.6 decision: a past_due subscription stays effectively paid for 3 days
// past its current_period_end before demoting to free -- covers a
// temporarily failed card without immediately cutting access, matching
// common SaaS practice.
const PAST_DUE_GRACE_DAYS = 3;

interface PlanRow {
  plan: string;
  subscription_status: string | null;
  current_period_end: string | null;
}

/**
 * Single source of truth for the "Plan" label and past_due grace-period
 * messaging -- combines the legacy manually-set `plan` column (kept as a
 * valid override, e.g. grandfathered or admin-granted access) with
 * Stripe's subscription_status/current_period_end. Note this no longer
 * gates audit access by itself -- see getTokenBalance/canRunAudit for
 * that; a past_due user's remaining token balance simply isn't reset
 * until their next successful payment, so no separate grace carve-out is
 * needed there.
 */
export async function getEffectivePlan(userId: string): Promise<'free' | 'paid'> {
  const rows = await query<PlanRow>(
    'select plan, subscription_status, current_period_end from users where id = ?',
    [userId]
  );
  const user = rows[0];
  if (!user) return 'free';

  if (user.plan === 'paid') return 'paid';
  if (user.subscription_status === 'active') return 'paid';
  if (user.subscription_status === 'past_due' && user.current_period_end) {
    const graceEndMs =
      new Date(user.current_period_end).getTime() + PAST_DUE_GRACE_DAYS * 24 * 60 * 60 * 1000;
    if (Date.now() < graceEndMs) return 'paid';
  }
  return 'free';
}

export async function getSubscriptionStatus(userId: string): Promise<string | null> {
  const rows = await query<{ subscription_status: string | null }>(
    'select subscription_status from users where id = ?',
    [userId]
  );
  return rows[0]?.subscription_status ?? null;
}

interface TokenRow {
  plan: string;
  token_allotment: number | null;
  token_period_start: string | null;
}

/**
 * Tokens remaining in the current period. Derived by counting `audits`
 * rows since token_period_start rather than a decremented counter --
 * avoids read-then-write races on concurrent requests and matches how
 * the rest of this schema treats `audits` as the append-only source of
 * truth for usage. Returns null for the legacy `plan = 'paid'` admin
 * override, which is treated as unlimited (distinct from a normal paid
 * subscriber's 20/period cap).
 */
export async function getTokenBalance(userId: string): Promise<number | null> {
  const rows = await query<TokenRow>(
    'select plan, token_allotment, token_period_start from users where id = ?',
    [userId]
  );
  const user = rows[0];
  if (!user) return 0;
  if (user.plan === 'paid') return null;

  const allotment = user.token_allotment ?? 0;
  if (!user.token_period_start) return allotment;

  const usedRows = await query<{ count: number }>(
    'select count(*) as count from audits where user_id = ? and created_at >= ?',
    [userId, user.token_period_start]
  );
  const used = Number(usedRows[0]?.count ?? 0);
  return Math.max(allotment - used, 0);
}

export async function canRunAudit(
  userId: string
): Promise<{ allowed: boolean; reason?: 'no_tokens' | 'daily_cap' }> {
  const balance = await getTokenBalance(userId);
  if (balance !== null && balance <= 0) {
    return { allowed: false, reason: 'no_tokens' };
  }

  const dayRows = await query<{ count: number }>(
    "select count(*) as count from audits where user_id = ? and created_at >= datetime('now', 'start of day')",
    [userId]
  );
  if (Number(dayRows[0]?.count ?? 0) >= DAILY_ABUSE_CAP) {
    return { allowed: false, reason: 'daily_cap' };
  }

  return { allowed: true };
}
