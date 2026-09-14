import { Resend } from 'resend';
import { SITE_NAME } from './site';

let client: Resend | undefined;

function getClient(): Resend {
  if (!client) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      throw new Error('RESEND_API_KEY is not set. Add it to your environment.');
    }
    client = new Resend(apiKey);
  }
  return client;
}

// resend.dev's shared onboarding address works with no domain verification,
// so this has a real default before a custom domain is configured.
const FROM_ADDRESS = process.env.RESEND_FROM_EMAIL || `${SITE_NAME} <onboarding@resend.dev>`;

export interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
}

/**
 * Throws on failure rather than swallowing it -- callers decide how to
 * degrade (e.g. logging it clearly instead of a silent black hole), per
 * §1.5's acceptance criteria.
 */
export async function sendEmail({ to, subject, html }: SendEmailInput): Promise<void> {
  const { error } = await getClient().emails.send({ from: FROM_ADDRESS, to, subject, html });
  if (error) {
    throw new Error(`Failed to send email via Resend: ${error.message}`);
  }
}
