import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/db', () => ({
  query: vi.fn(),
}));

beforeEach(() => {
  vi.resetAllMocks();
});

describe('dailyAuditLimit', () => {
  it('gives free-plan users 1 audit per day', async () => {
    const { dailyAuditLimit } = await import('@/lib/rate-limit');
    expect(dailyAuditLimit('free')).toBe(1);
  });

  it('gives paid-plan users 5 audits per day', async () => {
    const { dailyAuditLimit } = await import('@/lib/rate-limit');
    expect(dailyAuditLimit('paid')).toBe(5);
  });

  it('treats any unrecognized plan as free', async () => {
    const { dailyAuditLimit } = await import('@/lib/rate-limit');
    expect(dailyAuditLimit('trial')).toBe(1);
    expect(dailyAuditLimit('')).toBe(1);
  });
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
