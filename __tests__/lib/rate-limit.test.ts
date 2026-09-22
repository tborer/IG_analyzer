import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/db', () => ({
  query: vi.fn(),
}));

beforeEach(() => {
  vi.resetAllMocks();
});

describe('getEffectivePlan', () => {
  it('returns free for an unknown user', async () => {
    const { query } = await import('@/lib/db');
    vi.mocked(query).mockResolvedValueOnce([]);
    const { getEffectivePlan } = await import('@/lib/rate-limit');

    expect(await getEffectivePlan('nobody')).toBe('free');
  });

  it('honors the legacy manually-set plan column as an override', async () => {
    const { query } = await import('@/lib/db');
    vi.mocked(query).mockResolvedValueOnce([
      { plan: 'paid', subscription_status: null, current_period_end: null },
    ]);
    const { getEffectivePlan } = await import('@/lib/rate-limit');

    expect(await getEffectivePlan('user-1')).toBe('paid');
  });

  it('treats an active subscription as paid', async () => {
    const { query } = await import('@/lib/db');
    vi.mocked(query).mockResolvedValueOnce([
      { plan: 'free', subscription_status: 'active', current_period_end: null },
    ]);
    const { getEffectivePlan } = await import('@/lib/rate-limit');

    expect(await getEffectivePlan('user-1')).toBe('paid');
  });

  it('treats a canceled subscription as free', async () => {
    const { query } = await import('@/lib/db');
    vi.mocked(query).mockResolvedValueOnce([
      { plan: 'free', subscription_status: 'canceled', current_period_end: null },
    ]);
    const { getEffectivePlan } = await import('@/lib/rate-limit');

    expect(await getEffectivePlan('user-1')).toBe('free');
  });

  it('keeps a past_due user paid within the 3-day grace period', async () => {
    const { query } = await import('@/lib/db');
    const periodEnd = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(); // 1 day ago
    vi.mocked(query).mockResolvedValueOnce([
      { plan: 'free', subscription_status: 'past_due', current_period_end: periodEnd },
    ]);
    const { getEffectivePlan } = await import('@/lib/rate-limit');

    expect(await getEffectivePlan('user-1')).toBe('paid');
  });

  it('demotes a past_due user to free once the grace period has elapsed (boundary)', async () => {
    const { query } = await import('@/lib/db');
    const periodEnd = new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(); // 4 days ago
    vi.mocked(query).mockResolvedValueOnce([
      { plan: 'free', subscription_status: 'past_due', current_period_end: periodEnd },
    ]);
    const { getEffectivePlan } = await import('@/lib/rate-limit');

    expect(await getEffectivePlan('user-1')).toBe('free');
  });
});

describe('getSubscriptionStatus', () => {
  it('returns the raw status', async () => {
    const { query } = await import('@/lib/db');
    vi.mocked(query).mockResolvedValueOnce([{ subscription_status: 'past_due' }]);
    const { getSubscriptionStatus } = await import('@/lib/rate-limit');

    expect(await getSubscriptionStatus('user-1')).toBe('past_due');
  });

  it('returns null for an unknown user', async () => {
    const { query } = await import('@/lib/db');
    vi.mocked(query).mockResolvedValueOnce([]);
    const { getSubscriptionStatus } = await import('@/lib/rate-limit');

    expect(await getSubscriptionStatus('nobody')).toBeNull();
  });
});

describe('getTokenBalance', () => {
  it('returns 0 for an unknown user', async () => {
    const { query } = await import('@/lib/db');
    vi.mocked(query).mockResolvedValueOnce([]);
    const { getTokenBalance } = await import('@/lib/rate-limit');

    expect(await getTokenBalance('nobody')).toBe(0);
  });

  it('subtracts audits created since token_period_start from the allotment', async () => {
    const { query } = await import('@/lib/db');
    vi.mocked(query).mockResolvedValueOnce([
      { token_allotment: 20, token_period_start: '2026-09-01T00:00:00.000Z' },
    ]);
    vi.mocked(query).mockResolvedValueOnce([{ count: 7 }]);
    const { getTokenBalance } = await import('@/lib/rate-limit');

    expect(await getTokenBalance('user-1')).toBe(13);
    expect(query).toHaveBeenCalledWith(
      'select count(*) as count from audits where user_id = ? and created_at >= ?',
      ['user-1', '2026-09-01T00:00:00.000Z']
    );
  });

  it('never returns a negative balance', async () => {
    const { query } = await import('@/lib/db');
    vi.mocked(query).mockResolvedValueOnce([
      { token_allotment: 1, token_period_start: '2026-09-01T00:00:00.000Z' },
    ]);
    vi.mocked(query).mockResolvedValueOnce([{ count: 5 }]);
    const { getTokenBalance } = await import('@/lib/rate-limit');

    expect(await getTokenBalance('user-1')).toBe(0);
  });

  it('does not treat the legacy plan=paid override as unlimited (regression)', async () => {
    const { query } = await import('@/lib/db');
    vi.mocked(query).mockResolvedValueOnce([
      { token_allotment: 0, token_period_start: '2026-09-01T00:00:00.000Z' },
    ]);
    vi.mocked(query).mockResolvedValueOnce([{ count: 0 }]);
    const { getTokenBalance } = await import('@/lib/rate-limit');

    expect(await getTokenBalance('user-1')).toBe(0);
  });
});

describe('canRunAudit', () => {
  it('allows a request when tokens remain and the daily cap is not hit', async () => {
    const { query } = await import('@/lib/db');
    vi.mocked(query).mockResolvedValueOnce([
      { token_allotment: 1, token_period_start: '2026-09-01T00:00:00.000Z' },
    ]);
    vi.mocked(query).mockResolvedValueOnce([{ count: 0 }]); // period usage
    vi.mocked(query).mockResolvedValueOnce([{ count: 0 }]); // today's usage
    const { canRunAudit } = await import('@/lib/rate-limit');

    expect(await canRunAudit('user-1')).toEqual({ allowed: true });
  });

  it('blocks with reason no_tokens once the balance is exhausted', async () => {
    const { query } = await import('@/lib/db');
    vi.mocked(query).mockResolvedValueOnce([
      { token_allotment: 1, token_period_start: '2026-09-01T00:00:00.000Z' },
    ]);
    vi.mocked(query).mockResolvedValueOnce([{ count: 1 }]); // period usage == allotment
    const { canRunAudit } = await import('@/lib/rate-limit');

    expect(await canRunAudit('user-1')).toEqual({ allowed: false, reason: 'no_tokens' });
  });

  it('blocks with reason daily_cap once 10 audits ran today, even with tokens left', async () => {
    const { query } = await import('@/lib/db');
    vi.mocked(query).mockResolvedValueOnce([
      { token_allotment: 20, token_period_start: '2026-09-01T00:00:00.000Z' },
    ]);
    vi.mocked(query).mockResolvedValueOnce([{ count: 5 }]); // period usage
    vi.mocked(query).mockResolvedValueOnce([{ count: 10 }]); // today's usage
    const { canRunAudit } = await import('@/lib/rate-limit');

    expect(await canRunAudit('user-1')).toEqual({ allowed: false, reason: 'daily_cap' });
  });

  it('blocks a plan=paid account with no token_allotment set (regression)', async () => {
    const { query } = await import('@/lib/db');
    vi.mocked(query).mockResolvedValueOnce([
      { token_allotment: 0, token_period_start: '2026-09-01T00:00:00.000Z' },
    ]);
    vi.mocked(query).mockResolvedValueOnce([{ count: 0 }]); // period usage
    const { canRunAudit } = await import('@/lib/rate-limit');

    expect(await canRunAudit('user-1')).toEqual({ allowed: false, reason: 'no_tokens' });
  });
});
