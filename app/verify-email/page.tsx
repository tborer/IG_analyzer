import type { Metadata } from 'next';
import { Suspense } from 'react';
import Link from 'next/link';
import VerifyEmailStatus from '@/components/VerifyEmailStatus';

export const metadata: Metadata = {
  title: 'Verify email',
  robots: { index: false, follow: true },
};

export default function VerifyEmailPage() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-16 sm:py-24">
      <Link href="/" className="font-display text-lg tracking-tight mb-16 inline-block">
        Caliber
      </Link>
      <h1 className="font-display text-3xl mb-8">Email verification</h1>
      <Suspense fallback={<p className="text-sm text-mist">Verifying…</p>}>
        <VerifyEmailStatus />
      </Suspense>
    </main>
  );
}
