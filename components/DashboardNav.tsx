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
      <button onClick={logout} className="eyebrow text-mist hover:text-bone transition-colors">
        Log out
      </button>
    </header>
  );
}
