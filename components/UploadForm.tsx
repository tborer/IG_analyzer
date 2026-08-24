'use client';

import { useState, useRef, useEffect } from 'react';
import AuditResults, { AuditResult } from './AuditResults';
import { compressImages } from '@/lib/image-client';

const MAX_PHOTOS = 12;
const MAX_TOTAL_BYTES = 4 * 1024 * 1024; // stay comfortably under Vercel's request-body ceiling

const PLATFORMS = ['Instagram', 'TikTok', 'X / Twitter', 'Facebook', 'LinkedIn', 'Other'];

const INCLUDE_TIPS = [
  'Your profile header — photo, bio, name',
  'A full grid or feed overview (scroll and screenshot in pieces if needed)',
  'A handful of individual posts, captions included',
  'Highlights or pinned content, if the platform has them',
];

export default function UploadForm() {
  const [platform, setPlatform] = useState(PLATFORMS[0]);
  const [customPlatform, setCustomPlatform] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [bio, setBio] = useState('');
  const [loading, setLoading] = useState(false);
  const [compressing, setCompressing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AuditResult | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Revoke any outstanding object URLs when the component unmounts.
  useEffect(() => {
    return () => previewUrls.forEach((url) => URL.revokeObjectURL(url));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function replaceFiles(next: File[]) {
    setPreviewUrls((prevUrls) => {
      prevUrls.forEach((url) => URL.revokeObjectURL(url));
      return next.map((f) => URL.createObjectURL(f));
    });
    setFiles(next);
  }

  async function handleFiles(list: FileList | null) {
    if (!list || list.length === 0) return;
    setError(null);
    setCompressing(true);
    try {
      const compressed = await compressImages(Array.from(list));
      replaceFiles([...files, ...compressed].slice(0, MAX_PHOTOS));
    } finally {
      setCompressing(false);
    }
  }

  function removeAt(i: number) {
    replaceFiles(files.filter((_, idx) => idx !== i));
  }

  async function submit() {
    if (files.length === 0) {
      setError('Add at least one screenshot.');
      return;
    }
    const totalBytes = files.reduce((sum, f) => sum + f.size, 0);
    if (totalBytes > MAX_TOTAL_BYTES) {
      setError('Your screenshots are still too large after compression — remove one or two and try again.');
      return;
    }
    setError(null);
    setLoading(true);
    setResult(null);
    try {
      const form = new FormData();
      files.forEach((f) => form.append('photos', f));
      if (bio.trim()) form.append('bio', bio.trim());
      const resolvedPlatform = platform === 'Other' ? customPlatform.trim() || 'Other' : platform;
      form.append('platform', resolvedPlatform);

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
        <label className="eyebrow text-mist mb-3 block" htmlFor="platform">
          Platform
        </label>
        <div className="flex flex-wrap gap-2">
          {PLATFORMS.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPlatform(p)}
              className={`eyebrow px-3 py-2 rounded-full border transition-colors ${
                platform === p
                  ? 'border-brass/60 text-brass bg-brass/10'
                  : 'border-hair text-mist hover:text-bone'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
        {platform === 'Other' && (
          <input
            type="text"
            value={customPlatform}
            onChange={(e) => setCustomPlatform(e.target.value)}
            placeholder="Which platform?"
            maxLength={40}
            className="mt-3 w-full sm:w-64 bg-inkraised border border-hair rounded-lg px-4 py-2 text-sm text-bone placeholder:text-mist/60 focus:border-brass/50"
          />
        )}
      </div>

      <div className="border border-hair rounded-lg bg-inkraised p-4">
        <p className="eyebrow text-brass mb-2">For the fullest audit, include screenshots of</p>
        <ul className="text-sm text-bone/75 space-y-1">
          {INCLUDE_TIPS.map((tip) => (
            <li key={tip} className="flex gap-2">
              <span className="text-mist">·</span>
              <span>{tip}</span>
            </li>
          ))}
        </ul>
        <p className="text-xs text-mist mt-2">
          Missing something is fine — the audit will call out what it couldn't assess.
        </p>
      </div>

      <div>
        <p className="eyebrow text-mist mb-3">
          Screenshots ({files.length}/{MAX_PHOTOS})
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {previewUrls.map((url, i) => (
            <div key={i} className="relative aspect-[4/5] rounded-lg overflow-hidden border border-hair group">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt="" className="w-full h-full object-cover" />
              <button
                onClick={() => removeAt(i)}
                className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-ink/80 border border-hair text-bone text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                aria-label="Remove screenshot"
              >
                ✕
              </button>
            </div>
          ))}
          {files.length < MAX_PHOTOS && (
            <button
              onClick={() => inputRef.current?.click()}
              disabled={compressing}
              className="aspect-[4/5] rounded-lg border border-dashed border-hair flex flex-col items-center justify-center gap-2 text-mist hover:text-brass hover:border-brass/50 transition-colors disabled:opacity-50"
            >
              <span className="text-2xl leading-none">{compressing ? '…' : '+'}</span>
              <span className="eyebrow">{compressing ? 'Optimizing' : 'Add screenshot'}</span>
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
          Extra text context (optional)
        </label>
        <textarea
          id="bio"
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          rows={4}
          maxLength={600}
          placeholder="Paste your bio or a caption if it's hard to read in the screenshot."
          className="w-full bg-inkraised border border-hair rounded-lg p-4 text-sm text-bone placeholder:text-mist/60 focus:border-brass/50 resize-none"
        />
      </div>

      {error && <p className="text-sm text-signal">{error}</p>}

      <button
        onClick={submit}
        disabled={loading || compressing}
        className="w-full sm:w-auto px-6 py-3 bg-brass text-ink font-medium rounded-lg hover:bg-brass/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? 'Reviewing your profile…' : 'Run the audit'}
      </button>
    </div>
  );
}
