import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/smtp', () => ({
  sendOwnerNotification: vi.fn(),
}));

function makeRequest(body: unknown) {
  return new NextRequest('http://localhost/api/waitlist', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.resetAllMocks();
  process.env.ENABLE_WAITLIST = 'true';
});

describe('POST /api/waitlist', () => {
  it('refuses when the waitlist is not enabled', async () => {
    process.env.ENABLE_WAITLIST = 'false';
    const { POST } = await import('@/app/api/waitlist/route');

    const res = await POST(makeRequest({ email: 'a@example.com' }));
    expect(res.status).toBe(404);
  });

  it('rejects an invalid email', async () => {
    const { POST } = await import('@/app/api/waitlist/route');
    const { sendOwnerNotification } = await import('@/lib/smtp');

    const res = await POST(makeRequest({ email: 'not-an-email' }));
    expect(res.status).toBe(400);
    expect(sendOwnerNotification).not.toHaveBeenCalled();
  });

  it('sends a notification for a valid email', async () => {
    const { POST } = await import('@/app/api/waitlist/route');
    const { sendOwnerNotification } = await import('@/lib/smtp');

    const res = await POST(makeRequest({ email: 'Person@Example.com' }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(sendOwnerNotification).toHaveBeenCalledWith(
      expect.objectContaining({ replyTo: 'person@example.com' })
    );
  });

  it('returns 500 when sending fails', async () => {
    const { POST } = await import('@/app/api/waitlist/route');
    const { sendOwnerNotification } = await import('@/lib/smtp');
    vi.mocked(sendOwnerNotification).mockRejectedValueOnce(new Error('smtp down'));

    const res = await POST(makeRequest({ email: 'a@example.com' }));
    expect(res.status).toBe(500);
  });
});
