'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function ResetPasswordForm() {
  const router = useRouter();
  const token = useSearchParams().get('token') || '';
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState<'idle' | 'saving' | 'done'>('idle');
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setStatus('saving');
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || 'Something went wrong.');
      setStatus('done');
      setTimeout(() => router.push('/login'), 2000);
    } catch (err) {
      setError((err as Error).message);
      setStatus('idle');
    }
  }

  if (!token) {
    return <p className="text-sm text-signal max-w-sm">This link is missing its token — request a new one from the forgot-password page.</p>;
  }

  if (status === 'done') {
    return <p className="text-sm text-moss max-w-sm">Password updated. Redirecting to login…</p>;
  }

  return (
    <form onSubmit={submit} className="space-y-5 max-w-sm">
      <div>
        <label htmlFor="password" className="eyebrow text-mist mb-2 block">
          New password
        </label>
        <input
          id="password"
          type="password"
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full bg-inkraised border border-hair rounded-lg px-4 py-3 text-sm text-bone focus:border-brass/50"
        />
      </div>
      {error && <p className="text-sm text-signal">{error}</p>}
      <button
        type="submit"
        disabled={status === 'saving'}
        className="w-full px-6 py-3 bg-brass text-ink font-medium rounded-lg hover:bg-brass/90 disabled:opacity-50 transition-colors"
      >
        {status === 'saving' ? 'Saving…' : 'Set new password'}
      </button>
    </form>
  );
}
