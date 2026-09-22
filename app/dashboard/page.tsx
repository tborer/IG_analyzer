import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getCurrentUserId } from '@/lib/auth';
import { query } from '@/lib/db';
import { getTokenBalance } from '@/lib/rate-limit';
import DashboardNav from '@/components/DashboardNav';
import UploadForm from '@/components/UploadForm';
import VerifyEmailBanner from '@/components/VerifyEmailBanner';

export const metadata: Metadata = {
  title: 'New audit',
};

export default async function DashboardPage() {
  const userId = await getCurrentUserId();
  if (!userId) redirect('/login');

  const rows = await query<{ email_verified_at: string | null }>(
    'select email_verified_at from users where id = ?',
    [userId]
  );
  const isVerified = Boolean(rows[0]?.email_verified_at);
  const tokenBalance = await getTokenBalance(userId);
  const verificationEnabled = process.env.ENABLE_EMAIL_VERIFICATION === 'true';
  const otherPlatformsEnabled = process.env.ENABLE_OTHER_PLATFORMS === 'true';

  return (
    <main className="max-w-4xl mx-auto px-6 py-12 sm:py-16">
      <DashboardNav />
      {verificationEnabled && !isVerified && <VerifyEmailBanner />}
      <p className="eyebrow text-brass mb-3">New audit</p>
      <h1 className="font-display text-3xl mb-3">Let&apos;s look at your profile.</h1>
      <p className="eyebrow text-mist mb-10">
        {tokenBalance} audit{tokenBalance === 1 ? '' : 's'} remaining this period
      </p>
      <UploadForm otherPlatformsEnabled={otherPlatformsEnabled} />
    </main>
  );
}
