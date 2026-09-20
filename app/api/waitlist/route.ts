import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { sendOwnerNotification } from '@/lib/smtp';

const WaitlistSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
});

export async function POST(req: NextRequest) {
  if (process.env.ENABLE_WAITLIST !== 'true') {
    return NextResponse.json({ error: 'The waitlist is not open right now.' }, { status: 404 });
  }

  const body = await req.json().catch(() => ({}));
  const parsed = WaitlistSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Enter a valid email address.' }, { status: 400 });
  }

  const { email } = parsed.data;
  try {
    await sendOwnerNotification({
      subject: 'New waitlist signup',
      text: `New waitlist signup: ${email}`,
      replyTo: email,
    });
  } catch (err) {
    console.error('Failed to send waitlist notification', err);
    return NextResponse.json({ error: 'Something went wrong. Try again later.' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
