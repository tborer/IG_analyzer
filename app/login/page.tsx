import type { Metadata } from 'next';
import Link from 'next/link';
import AuthForm from '@/components/AuthForm';

export const metadata: Metadata = {
  title: 'Log in',
  robots: { index: false, follow: true },
};

export default function LoginPage() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-16 sm:py-24">
      <Link href="/" className="font-display text-lg tracking-tight mb-16 inline-block">
        Caliber
      </Link>
      <h1 className="font-display text-3xl mb-8">Log in</h1>
      <AuthForm mode="login" />
      <p className="text-sm text-mist mt-6">
        No account yet?{' '}
        <Link href="/signup" className="text-brass hover:underline">
          Sign up
        </Link>
      </p>
    </main>
  );
}
