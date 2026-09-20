import nodemailer, { Transporter } from 'nodemailer';

let transporter: Transporter | undefined;

// Created lazily on first use, not at module load -- same reasoning as
// lib/db.ts and lib/stripe.ts: importing this file (e.g. during `next
// build`'s page-data collection) must never throw just because the SMTP
// env vars aren't set.
function getTransporter(): Transporter {
  if (!transporter) {
    const host = process.env.SMTP_HOST;
    const port = process.env.SMTP_PORT;
    const user = process.env.SMTP_USER;
    const password = process.env.SMTP_PASSWORD;
    if (!host || !port || !user || !password) {
      throw new Error('SMTP is not configured. Set SMTP_HOST, SMTP_PORT, SMTP_USER, and SMTP_PASSWORD.');
    }
    const numericPort = Number(port);
    transporter = nodemailer.createTransport({
      host,
      port: numericPort,
      secure: numericPort === 465,
      auth: { user, pass: password },
    });
  }
  return transporter;
}

const FROM_ADDRESS = process.env.SMTP_FROM || process.env.SMTP_USER;

export interface SendSmtpEmailInput {
  subject: string;
  text: string;
  replyTo?: string;
}

/**
 * Sends a plain-text notification to the site owner's inbox
 * (CONTACT_TO_EMAIL) -- used for both the waitlist signup and contact
 * forms, which share the same SMTP setup. Throws on failure rather than
 * swallowing it, per the pattern in lib/email.ts.
 */
export async function sendOwnerNotification({ subject, text, replyTo }: SendSmtpEmailInput): Promise<void> {
  const to = process.env.CONTACT_TO_EMAIL;
  if (!to) {
    throw new Error('CONTACT_TO_EMAIL is not set. Add it to your environment.');
  }
  await getTransporter().sendMail({
    from: FROM_ADDRESS,
    to,
    subject,
    text,
    ...(replyTo ? { replyTo } : {}),
  });
}
