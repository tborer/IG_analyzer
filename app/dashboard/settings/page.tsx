import { redirect } from 'next/navigation';
import { getCurrentUserId } from '@/lib/auth';
import DashboardNav from '@/components/DashboardNav';
import ChangePasswordForm from '@/components/ChangePasswordForm';

export default async function SettingsPage() {
  const userId = await getCurrentUserId();
  if (!userId) redirect('/login');

  return (
    <main className="max-w-4xl mx-auto px-6 py-12 sm:py-16">
      <DashboardNav />
      <p className="eyebrow text-brass mb-3">Account</p>
      <h1 className="font-display text-3xl mb-10">Change your password</h1>
      <ChangePasswordForm />
    </main>
  );
}
