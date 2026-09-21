import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getCurrentUserId } from '@/lib/auth';
import { query } from '@/lib/db';
import { getEffectivePlan, getTokenBalance } from '@/lib/rate-limit';
import DashboardNav from '@/components/DashboardNav';
import ChangePasswordForm from '@/components/ChangePasswordForm';
import BillingSection from '@/components/BillingSection';

export const metadata: Metadata = {
  title: 'Settings',
};

export default async function SettingsPage() {
  const userId = await getCurrentUserId();
  if (!userId) redirect('/login');

  const rows = await query<{
    subscription_status: string | null;
    current_period_end: string | null;
    stripe_customer_id: string | null;
    token_allotment: number | null;
  }>(
    'select subscription_status, current_period_end, stripe_customer_id, token_allotment from users where id = ?',
    [userId]
  );
  const user = rows[0];
  const effectivePlan = await getEffectivePlan(userId);
  const tokenBalance = await getTokenBalance(userId);

  return (
    <main className="max-w-4xl mx-auto px-6 py-12 sm:py-16">
      <DashboardNav />
      <p className="eyebrow text-brass mb-3">Account</p>
      <h1 className="font-display text-3xl mb-10">Settings</h1>

      <BillingSection
        effectivePlan={effectivePlan}
        subscriptionStatus={user?.subscription_status ?? null}
        currentPeriodEnd={user?.current_period_end ?? null}
        hasStripeCustomer={Boolean(user?.stripe_customer_id)}
        stripeEnabled={process.env.ENABLE_STRIPE === 'true'}
        tokenBalance={tokenBalance}
        tokenAllotment={user?.token_allotment ?? undefined}
      />

      <p className="eyebrow text-brass mb-3">Password</p>
      <ChangePasswordForm />
    </main>
  );
}
