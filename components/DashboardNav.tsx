'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function DashboardNav() {
  const router = useRouter();

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/');
    router.refresh();
  }

  return (
    <header className="flex items-center justify-between mb-12">
      <Link href="/" className="font-display text-lg tracking-tight">
        Dossier
      </Link>
      <nav className="flex items-center gap-6">
        <Link href="/dashboard" className="eyebrow text-mist hover:text-bone transition-colors">
          New audit
        </Link>
        <Link href="/dashboard/history" className="eyebrow text-mist hover:text-bone transition-colors">
          History
        </Link>
        <Link href="/dashboard/settings" className="eyebrow text-mist hover:text-bone transition-colors">
          Settings
        </Link>
        <button onClick={logout} className="eyebrow text-mist hover:text-bone transition-colors">
          Log out
        </button>
      </nav>
    </header>
  );
}
