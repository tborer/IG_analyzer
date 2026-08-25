import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/db', () => ({
  query: vi.fn(),
}));

vi.mock('@/lib/auth', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/auth')>();
  return { ...actual, getCurrentUserId: vi.fn() };
});

vi.mock('@/lib/rate-limit', () => ({
  dailyAuditLimit: vi.fn(),
  getUserPlan: vi.fn(),
  getAuditsUsedToday: vi.fn(),
}));

vi.mock('@/lib/anthropic', () => ({
  runProfileAudit: vi.fn(),
}));

beforeEach(() => {
  vi.resetAllMocks();
});

function photoFile(name = 'photo.jpg') {
  return new File([new Uint8Array([1, 2, 3, 4])], name, { type: 'image/jpeg' });
}

function formRequest(form: FormData) {
  return new NextRequest('http://localhost/api/audit', { method: 'POST', body: form });
}

async function allowRateLimit() {
  const { dailyAuditLimit, getUserPlan, getAuditsUsedToday } = await import('@/lib/rate-limit');
  vi.mocked(getUserPlan).mockResolvedValue('free');
  vi.mocked(dailyAuditLimit).mockReturnValue(1);
  vi.mocked(getAuditsUsedToday).mockResolvedValue(0);
}

describe('POST /api/audit', () => {
  it('rejects when signed out', async () => {
    const { getCurrentUserId } = await import('@/lib/auth');
    vi.mocked(getCurrentUserId).mockResolvedValueOnce(null);
    const { POST } = await import('@/app/api/audit/route');

    const res = await POST(formRequest(new FormData()));
    expect(res.status).toBe(401);
  });

  it('blocks the request once the daily cap is used up', async () => {
    const { getCurrentUserId } = await import('@/lib/auth');
    const { dailyAuditLimit, getUserPlan, getAuditsUsedToday } = await import('@/lib/rate-limit');
    vi.mocked(getCurrentUserId).mockResolvedValueOnce('user-1');
    vi.mocked(getUserPlan).mockResolvedValueOnce('free');
    vi.mocked(dailyAuditLimit).mockReturnValueOnce(1);
    vi.mocked(getAuditsUsedToday).mockResolvedValueOnce(1);
    const { POST } = await import('@/app/api/audit/route');

    const res = await POST(formRequest(new FormData()));
    expect(res.status).toBe(429);
  });

  it('rejects a request with no photos', async () => {
    const { getCurrentUserId } = await import('@/lib/auth');
    vi.mocked(getCurrentUserId).mockResolvedValueOnce('user-1');
    await allowRateLimit();
    const { POST } = await import('@/app/api/audit/route');

    const res = await POST(formRequest(new FormData()));
    expect(res.status).toBe(400);
  });

  it('rejects more than the per-audit photo cap', async () => {
    const { getCurrentUserId } = await import('@/lib/auth');
    vi.mocked(getCurrentUserId).mockResolvedValueOnce('user-1');
    await allowRateLimit();
    const { POST } = await import('@/app/api/audit/route');

    const form = new FormData();
    for (let i = 0; i < 13; i++) form.append('photos', photoFile(`p${i}.jpg`));

    const res = await POST(formRequest(form));
    expect(res.status).toBe(400);
  });

  it('runs the audit and persists the result on success', async () => {
    const { getCurrentUserId } = await import('@/lib/auth');
    const { runProfileAudit } = await import('@/lib/anthropic');
    const { query } = await import('@/lib/db');
    vi.mocked(getCurrentUserId).mockResolvedValueOnce('user-1');
    await allowRateLimit();
    const fakeResult = { overallScore: 80, headline: 'Solid set' };
    vi.mocked(runProfileAudit).mockResolvedValueOnce({
      result: fakeResult,
      transcribedBio: null,
    } as never);
    vi.mocked(query).mockResolvedValueOnce([]);
    const { POST } = await import('@/app/api/audit/route');

    const form = new FormData();
    form.append('photos', photoFile());
    form.append('platform', 'TikTok');

    const res = await POST(formRequest(form));

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ...fakeResult, bioStaleness: null });
    expect(runProfileAudit).toHaveBeenCalledWith(
      expect.any(Array),
      undefined,
      'TikTok'
    );
    expect(query).toHaveBeenCalledWith(
      expect.stringContaining('insert into audits'),
      expect.arrayContaining(['user-1'])
    );
  });

  it('flags a bio that has been unchanged for the last few audits', async () => {
    const { getCurrentUserId } = await import('@/lib/auth');
    const { runProfileAudit } = await import('@/lib/anthropic');
    const { query } = await import('@/lib/db');
    vi.mocked(getCurrentUserId).mockResolvedValueOnce('user-1');
    await allowRateLimit();
    const fakeResult = { overallScore: 70, headline: 'Fine, but stale' };
    vi.mocked(runProfileAudit).mockResolvedValueOnce({
      result: fakeResult,
      transcribedBio: 'Founder @brandname • LA • Featured in Forbes',
    } as never);
    vi.mocked(query).mockResolvedValueOnce([
      { transcribed_bio: 'Founder @brandname • LA • Featured in Forbes' },
      { transcribed_bio: 'Founder @brandname • LA • Featured in Forbes' },
    ]); // prior-bios lookup
    vi.mocked(query).mockResolvedValueOnce([]); // insert

    const { POST } = await import('@/app/api/audit/route');
    const form = new FormData();
    form.append('photos', photoFile());

    const res = await POST(formRequest(form));
    const body = await res.json();

    expect(body.bioStaleness).not.toBeNull();
    expect(body.bioStaleness.streak).toBe(3);
    expect(query).toHaveBeenCalledWith(
      expect.stringContaining('insert into audits'),
      expect.arrayContaining(['Founder @brandname • LA • Featured in Forbes'])
    );
  });

  it('returns 502 without persisting when the model call fails', async () => {
    const { getCurrentUserId } = await import('@/lib/auth');
    const { runProfileAudit } = await import('@/lib/anthropic');
    const { query } = await import('@/lib/db');
    vi.mocked(getCurrentUserId).mockResolvedValueOnce('user-1');
    await allowRateLimit();
    vi.mocked(runProfileAudit).mockRejectedValueOnce(new Error('model exploded'));
    const { POST } = await import('@/app/api/audit/route');

    const form = new FormData();
    form.append('photos', photoFile());

    const res = await POST(formRequest(form));

    expect(res.status).toBe(502);
    expect(query).not.toHaveBeenCalled();
  });
});
