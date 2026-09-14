import type { Metadata } from 'next';
import { Suspense } from 'react';
import Link from 'next/link';
import ResetPasswordForm from '@/components/ResetPasswordForm';

export const metadata: Metadata = {
  title: 'Reset password',
  robots: { index: false, follow: true },
};

export default function ResetPasswordPage() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-16 sm:py-24">
      <Link href="/" className="font-display text-lg tracking-tight mb-16 inline-block">
        Caliber
      </Link>
      <h1 className="font-display text-3xl mb-8">Choose a new password</h1>
      <Suspense fallback={null}>
        <ResetPasswordForm />
      </Suspense>
    </main>
  );
}
