import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/smtp', () => ({
  sendOwnerNotification: vi.fn(),
}));

function makeRequest(body: unknown) {
  return new NextRequest('http://localhost/api/contact', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.resetAllMocks();
});

describe('POST /api/contact', () => {
  it('rejects an invalid email', async () => {
    const { POST } = await import('@/app/api/contact/route');
    const { sendOwnerNotification } = await import('@/lib/smtp');

    const res = await POST(makeRequest({ email: 'not-an-email', message: 'hi' }));
    expect(res.status).toBe(400);
    expect(sendOwnerNotification).not.toHaveBeenCalled();
  });

  it('rejects an empty message', async () => {
    const { POST } = await import('@/app/api/contact/route');

    const res = await POST(makeRequest({ email: 'a@example.com', message: '' }));
    expect(res.status).toBe(400);
  });

  it('sends a notification with the message and reply-to set to the sender', async () => {
    const { POST } = await import('@/app/api/contact/route');
    const { sendOwnerNotification } = await import('@/lib/smtp');

    const res = await POST(makeRequest({ email: 'a@example.com', message: 'Hello there' }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(sendOwnerNotification).toHaveBeenCalledWith(
      expect.objectContaining({ replyTo: 'a@example.com', text: expect.stringContaining('Hello there') })
    );
  });

  it('returns 500 when sending fails', async () => {
    const { POST } = await import('@/app/api/contact/route');
    const { sendOwnerNotification } = await import('@/lib/smtp');
    vi.mocked(sendOwnerNotification).mockRejectedValueOnce(new Error('smtp down'));

    const res = await POST(makeRequest({ email: 'a@example.com', message: 'hi' }));
    expect(res.status).toBe(500);
  });
});
