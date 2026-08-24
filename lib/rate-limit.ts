import { query } from './db';

export function dailyAuditLimit(plan: string): number {
  return plan === 'paid' ? 5 : 1;
}

export async function getUserPlan(userId: string): Promise<string> {
  const rows = await query<{ plan: string }>('select plan from users where id = ?', [userId]);
  return rows[0]?.plan ?? 'free';
}

export async function getAuditsUsedToday(userId: string): Promise<number> {
  const rows = await query<{ count: number }>(
    "select count(*) as count from audits where user_id = ? and created_at >= datetime('now', 'start of day')",
    [userId]
  );
  return Number(rows[0]?.count ?? 0);
}
