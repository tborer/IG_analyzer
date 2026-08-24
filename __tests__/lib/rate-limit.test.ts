import { describe, expect, it } from 'vitest';
import { dailyAuditLimit } from '@/lib/rate-limit';

describe('dailyAuditLimit', () => {
  it('gives free-plan users 1 audit per day', () => {
    expect(dailyAuditLimit('free')).toBe(1);
  });

  it('gives paid-plan users 5 audits per day', () => {
    expect(dailyAuditLimit('paid')).toBe(5);
  });

  it('treats any unrecognized plan as free', () => {
    expect(dailyAuditLimit('trial')).toBe(1);
    expect(dailyAuditLimit('')).toBe(1);
  });
});
