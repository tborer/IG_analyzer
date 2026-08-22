'use client';

import { useState, useRef } from 'react';
import AuditResults, { AuditResult } from './AuditResults';

const MAX_PHOTOS = 8;

export default function UploadForm() {
  const [files, setFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [bio, setBio] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AuditResult | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFiles(list: FileList | null) {
    if (!list) return;
    const next = [...files, ...Array.from(list)].slice(0, MAX_PHOTOS);
    setFiles(next);
    setPreviewUrls(next.map((f) => URL.createObjectURL(f)));
  }

  function removeAt(i: number) {
    const next = files.filter((_, idx) => idx !== i);
    setFiles(next);
    setPreviewUrls(next.map((f) => URL.createObjectURL(f)));
  }

  async function submit() {
    if (files.length === 0) {
      setError('Add at least one photo.');
      return;
    }
    setError(null);
    setLoading(true);
    setResult(null);
    try {
      const form = new FormData();
      files.forEach((f) => form.append('photos', f));
      if (bio.trim()) form.append('bio', bio.trim());

      const res = await fetch('/api/audit', { method: 'POST', body: form });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Request failed (${res.status})`);
      }
      const data: AuditResult = await res.json();
      setResult(data);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  if (result) {
    return (
      <div>
        <button
          onClick={() => setResult(null)}
          className="eyebrow text-mist hover:text-brass mb-6 inline-block"
        >
          ← Run another audit
        </button>
        <AuditResults result={result} previewUrls={previewUrls} />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <p className="eyebrow text-mist mb-3">
          Photos ({files.length}/{MAX_PHOTOS})
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {previewUrls.map((url, i) => (
            <div key={i} className="relative aspect-[4/5] rounded-lg overflow-hidden border border-hair group">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt="" className="w-full h-full object-cover" />
              <button
                onClick={() => removeAt(i)}
                className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-ink/80 border border-hair text-bone text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                aria-label="Remove photo"
              >
                ✕
              </button>
            </div>
          ))}
          {files.length < MAX_PHOTOS && (
            <button
              onClick={() => inputRef.current?.click()}
              className="aspect-[4/5] rounded-lg border border-dashed border-hair flex flex-col items-center justify-center gap-2 text-mist hover:text-brass hover:border-brass/50 transition-colors"
            >
              <span className="text-2xl leading-none">+</span>
              <span className="eyebrow">Add photo</span>
            </button>
          )}
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>

      <div>
        <label className="eyebrow text-mist mb-3 block" htmlFor="bio">
          Bio (optional)
        </label>
        <textarea
          id="bio"
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          rows={4}
          maxLength={600}
          placeholder="Paste your current bio to get it reviewed alongside your photos."
          className="w-full bg-inkraised border border-hair rounded-lg p-4 text-sm text-bone placeholder:text-mist/60 focus:border-brass/50 resize-none"
        />
      </div>

      {error && <p className="text-sm text-signal">{error}</p>}

      <button
        onClick={submit}
        disabled={loading}
        className="w-full sm:w-auto px-6 py-3 bg-brass text-ink font-medium rounded-lg hover:bg-brass/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? 'Reviewing your set…' : 'Run the audit'}
      </button>
    </div>
  );
}
