'use client';

import { useState } from 'react';

export default function ChangePasswordForm() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [status, setStatus] = useState<'idle' | 'saving' | 'done'>('idle');
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setStatus('saving');
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || 'Something went wrong.');
      setCurrentPassword('');
      setNewPassword('');
      setStatus('done');
    } catch (err) {
      setError((err as Error).message);
      setStatus('idle');
    }
  }

  return (
    <form onSubmit={submit} className="space-y-5 max-w-sm">
      <div>
        <label htmlFor="currentPassword" className="eyebrow text-mist mb-2 block">
          Current password
        </label>
        <input
          id="currentPassword"
          type="password"
          required
          value={currentPassword}
          onChange={(e) => {
            setCurrentPassword(e.target.value);
            setStatus('idle');
          }}
          className="w-full bg-inkraised border border-hair rounded-lg px-4 py-3 text-sm text-bone focus:border-brass/50"
        />
      </div>
      <div>
        <label htmlFor="newPassword" className="eyebrow text-mist mb-2 block">
          New password
        </label>
        <input
          id="newPassword"
          type="password"
          required
          minLength={8}
          value={newPassword}
          onChange={(e) => {
            setNewPassword(e.target.value);
            setStatus('idle');
          }}
          className="w-full bg-inkraised border border-hair rounded-lg px-4 py-3 text-sm text-bone focus:border-brass/50"
        />
      </div>
      {error && <p className="text-sm text-signal">{error}</p>}
      {status === 'done' && <p className="text-sm text-moss">Password updated.</p>}
      <button
        type="submit"
        disabled={status === 'saving'}
        className="w-full px-6 py-3 bg-brass text-ink font-medium rounded-lg hover:bg-brass/90 disabled:opacity-50 transition-colors"
      >
        {status === 'saving' ? 'Saving…' : 'Update password'}
      </button>
    </form>
  );
}
