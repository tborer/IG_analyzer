import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const ORIGINAL_ENV = process.env.PLAUSIBLE_DOMAIN;

afterEach(() => {
  vi.resetModules();
  vi.unstubAllGlobals();
  if (ORIGINAL_ENV === undefined) delete process.env.PLAUSIBLE_DOMAIN;
  else process.env.PLAUSIBLE_DOMAIN = ORIGINAL_ENV;
});

describe('trackEvent', () => {
  it('no-ops without throwing when PLAUSIBLE_DOMAIN is unset', async () => {
    delete process.env.PLAUSIBLE_DOMAIN;
    vi.resetModules();
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const { trackEvent } = await import('@/lib/analytics');

    trackEvent('signup_completed');

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('posts to the Plausible Events API server-side when configured', async () => {
    process.env.PLAUSIBLE_DOMAIN = 'example.com';
    vi.resetModules();
    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal('fetch', fetchMock);
    const { trackEvent } = await import('@/lib/analytics');

    trackEvent('signup_completed');

    expect(fetchMock).toHaveBeenCalledWith(
      'https://plausible.io/api/event',
      expect.objectContaining({ method: 'POST' })
    );
    const [, options] = fetchMock.mock.calls[0];
    const sentBody = JSON.parse(options.body);
    expect(sentBody).toMatchObject({ name: 'signup_completed', domain: 'example.com' });
  });
});
