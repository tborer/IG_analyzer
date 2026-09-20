'use client';

import { useState } from 'react';
import Modal from './Modal';

export default function WaitlistModal() {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'done'>('idle');
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setStatus('sending');
    setError(null);
    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || 'Something went wrong.');
      setStatus('done');
    } catch (err) {
      setError((err as Error).message);
      setStatus('idle');
    }
  }

  function close() {
    setOpen(false);
    setStatus('idle');
    setError(null);
    setEmail('');
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="eyebrow px-4 py-2 rounded-full border border-brass/50 text-brass hover:bg-brass/10 transition-colors"
      >
        Join waitlist
      </button>
      {open && (
        <Modal title="Join the waitlist" onClose={close}>
          {status === 'done' ? (
            <p className="text-sm text-moss">You&apos;re on the list — thanks for the interest.</p>
          ) : (
            <form onSubmit={submit} className="space-y-4">
              <div>
                <label htmlFor="waitlist-email" className="eyebrow text-mist mb-2 block">
                  Email
                </label>
                <input
                  id="waitlist-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-ink border border-hair rounded-lg px-4 py-3 text-sm text-bone focus:border-brass/50"
                />
              </div>
              {error && <p className="text-sm text-signal">{error}</p>}
              <button
                type="submit"
                disabled={status === 'sending'}
                className="w-full px-6 py-3 bg-brass text-ink font-medium rounded-lg hover:bg-brass/90 disabled:opacity-50 transition-colors"
              >
                {status === 'sending' ? 'Sending…' : 'Notify me'}
              </button>
            </form>
          )}
        </Modal>
      )}
    </>
  );
}
