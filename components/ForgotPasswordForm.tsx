'use client';

import { useState } from 'react';

export default function ForgotPasswordForm() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'done'>('idle');
  const [message, setMessage] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setStatus('sending');
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const body = await res.json().catch(() => ({}));
      setMessage(body.message || 'If that email is registered, a reset link is on its way.');
      setStatus('done');
    } catch {
      setMessage('If that email is registered, a reset link is on its way.');
      setStatus('done');
    }
  }

  if (status === 'done') {
    return <p className="text-sm text-moss max-w-sm">{message}</p>;
  }

  return (
    <form onSubmit={submit} className="space-y-5 max-w-sm">
      <div>
        <label htmlFor="email" className="eyebrow text-mist mb-2 block">
          Email
        </label>
        <input
          id="email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full bg-inkraised border border-hair rounded-lg px-4 py-3 text-sm text-bone focus:border-brass/50"
        />
      </div>
      <button
        type="submit"
        disabled={status === 'sending'}
        className="w-full px-6 py-3 bg-brass text-ink font-medium rounded-lg hover:bg-brass/90 disabled:opacity-50 transition-colors"
      >
        {status === 'sending' ? 'Sending…' : 'Send reset link'}
      </button>
    </form>
  );
}
