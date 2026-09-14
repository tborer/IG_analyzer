import { redirect } from 'next/navigation';
import { getCurrentUserId } from '@/lib/auth';
import { query } from '@/lib/db';
import DashboardNav from '@/components/DashboardNav';
import UploadForm from '@/components/UploadForm';
import VerifyEmailBanner from '@/components/VerifyEmailBanner';

export default async function DashboardPage() {
  const userId = await getCurrentUserId();
  if (!userId) redirect('/login');

  const rows = await query<{ email_verified_at: string | null }>(
    'select email_verified_at from users where id = ?',
    [userId]
  );
  const isVerified = Boolean(rows[0]?.email_verified_at);

  return (
    <main className="max-w-4xl mx-auto px-6 py-12 sm:py-16">
      <DashboardNav />
      {!isVerified && <VerifyEmailBanner />}
      <p className="eyebrow text-brass mb-3">New audit</p>
      <h1 className="font-display text-3xl mb-10">Let's look at your profile.</h1>
      <UploadForm />
    </main>
  );
}
