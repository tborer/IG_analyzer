import { query } from './db';

export function dailyAuditLimit(plan: string): number {
  return plan === 'paid' ? 5 : 1;
}

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
 * Single source of truth for paywalled gating -- combines the legacy
 * manually-set `plan` column (kept as a valid override, e.g. grandfathered
 * or admin-granted access) with Stripe's subscription_status/
 * current_period_end. Callers should use this instead of reading `plan`
 * directly.
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

export async function getAuditsUsedToday(userId: string): Promise<number> {
  const rows = await query<{ count: number }>(
    "select count(*) as count from audits where user_id = ? and created_at >= datetime('now', 'start of day')",
    [userId]
  );
  return Number(rows[0]?.count ?? 0);
}
