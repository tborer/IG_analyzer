'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

export default function VerifyEmailStatus() {
  const token = useSearchParams().get('token') || '';
  const [status, setStatus] = useState<'checking' | 'ok' | 'error'>(token ? 'checking' : 'error');

  useEffect(() => {
    if (!token) return;
    fetch('/api/auth/verify-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    })
      .then((res) => setStatus(res.ok ? 'ok' : 'error'))
      .catch(() => setStatus('error'));
  }, [token]);

  if (status === 'checking') return <p className="text-sm text-mist">Verifying…</p>;
  if (status === 'ok') return <p className="text-sm text-moss">Your email is verified.</p>;
  return (
    <p className="text-sm text-signal">
      That verification link is invalid or has expired. You can request a new one from your
      dashboard.
    </p>
  );
}
