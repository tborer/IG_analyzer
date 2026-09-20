import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { sendOwnerNotification } from '@/lib/smtp';

const ContactSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  message: z.string().trim().min(1).max(5000),
});

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const parsed = ContactSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Enter a valid email and a message.' }, { status: 400 });
  }

  const { email, message } = parsed.data;
  try {
    await sendOwnerNotification({
      subject: 'New contact message',
      text: `From: ${email}\n\n${message}`,
      replyTo: email,
    });
  } catch (err) {
    console.error('Failed to send contact message', err);
    return NextResponse.json({ error: 'Something went wrong. Try again later.' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
