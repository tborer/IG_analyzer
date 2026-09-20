'use client';

import { useState } from 'react';
import Modal from './Modal';

export default function ContactModal() {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'done'>('idle');
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setStatus('sending');
    setError(null);
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, message }),
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
    setMessage('');
  }

  return (
    <>
      <button onClick={() => setOpen(true)} className="hover:text-bone transition-colors">
        Contact
      </button>
      {open && (
        <Modal title="Contact us" onClose={close}>
          {status === 'done' ? (
            <p className="text-sm text-moss">Thanks — your message is on its way.</p>
          ) : (
            <form onSubmit={submit} className="space-y-4">
              <div>
                <label htmlFor="contact-email" className="eyebrow text-mist mb-2 block">
                  Your email
                </label>
                <input
                  id="contact-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-ink border border-hair rounded-lg px-4 py-3 text-sm text-bone focus:border-brass/50"
                />
              </div>
              <div>
                <label htmlFor="contact-message" className="eyebrow text-mist mb-2 block">
                  Message
                </label>
                <textarea
                  id="contact-message"
                  required
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full bg-ink border border-hair rounded-lg px-4 py-3 text-sm text-bone focus:border-brass/50"
                />
              </div>
              {error && <p className="text-sm text-signal">{error}</p>}
              <button
                type="submit"
                disabled={status === 'sending'}
                className="w-full px-6 py-3 bg-brass text-ink font-medium rounded-lg hover:bg-brass/90 disabled:opacity-50 transition-colors"
              >
                {status === 'sending' ? 'Sending…' : 'Send message'}
              </button>
            </form>
          )}
        </Modal>
      )}
    </>
  );
}
