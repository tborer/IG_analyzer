import { redirect } from 'next/navigation';
import { getCurrentUserId } from '@/lib/auth';
import DashboardNav from '@/components/DashboardNav';
import UploadForm from '@/components/UploadForm';

export default async function DashboardPage() {
  const userId = await getCurrentUserId();
  if (!userId) redirect('/login');

  return (
    <main className="max-w-4xl mx-auto px-6 py-12 sm:py-16">
      <DashboardNav />
      <p className="eyebrow text-brass mb-3">New audit</p>
      <h1 className="font-display text-3xl mb-10">Let's look at your profile.</h1>
      <UploadForm />
    </main>
  );
}
