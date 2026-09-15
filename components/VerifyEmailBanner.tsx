'use client';

import { useState } from 'react';

export default function VerifyEmailBanner() {
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');

  async function resend() {
    setStatus('sending');
    try {
      const res = await fetch('/api/auth/resend-verification', { method: 'POST' });
      setStatus(res.ok ? 'sent' : 'error');
    } catch {
      setStatus('error');
    }
  }

  return (
    <div className="border border-hair rounded-lg bg-inkraised px-4 py-3 mb-8 flex items-center justify-between gap-4 flex-wrap">
      <p className="text-sm text-mist">
        {status === 'sent'
          ? 'Verification email sent — check your inbox.'
          : 'Please verify your email address.'}
      </p>
      {status !== 'sent' && (
        <button
          onClick={resend}
          disabled={status === 'sending'}
          className="eyebrow text-brass hover:underline disabled:opacity-50 shrink-0"
        >
          {status === 'sending' ? 'Sending…' : 'Resend verification email'}
        </button>
      )}
      {status === 'error' && (
        <p className="text-xs text-signal w-full">Couldn't send it — try again in a moment.</p>
      )}
    </div>
  );
}
