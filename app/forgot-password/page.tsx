import type { Metadata } from 'next';
import Link from 'next/link';
import ForgotPasswordForm from '@/components/ForgotPasswordForm';

export const metadata: Metadata = {
  title: 'Forgot password',
  robots: { index: false, follow: true },
};

export default function ForgotPasswordPage() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-16 sm:py-24">
      <Link href="/" className="font-display text-lg tracking-tight mb-16 inline-block">
        Caliber
      </Link>
      <h1 className="font-display text-3xl mb-4">Forgot your password?</h1>
      <p className="text-sm text-mist mb-8 max-w-sm">
        Enter the email on your account and we'll send you a link to choose a new password.
      </p>
      <ForgotPasswordForm />
    </main>
  );
}
