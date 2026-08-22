import { randomUUID } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserId } from '@/lib/auth';
import { query } from '@/lib/db';
import { runProfileAudit, PhotoInput } from '@/lib/anthropic';

const MAX_PHOTOS = 8;
const MAX_BYTES = 8 * 1024 * 1024; // 8MB per photo
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

export async function POST(req: NextRequest) {
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ error: 'Sign in to run an audit.' }, { status: 401 });
  }

  const form = await req.formData();
  const fileEntries = form.getAll('photos').filter((f): f is File => f instanceof File);
  const bio = form.get('bio');
  const bioText = typeof bio === 'string' && bio.trim() ? bio.trim().slice(0, 600) : undefined;

  if (fileEntries.length === 0) {
    return NextResponse.json({ error: 'Add at least one photo.' }, { status: 400 });
  }
  if (fileEntries.length > MAX_PHOTOS) {
    return NextResponse.json({ error: `Max ${MAX_PHOTOS} photos per audit.` }, { status: 400 });
  }

  const photos: PhotoInput[] = [];
  for (const file of fileEntries) {
    if (!ALLOWED_TYPES.has(file.type)) {
      return NextResponse.json(
        { error: `Unsupported file type: ${file.type || 'unknown'}. Use JPEG, PNG, or WebP.` },
        { status: 400 }
      );
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: 'Each photo must be under 8MB.' }, { status: 400 });
    }
    const buf = Buffer.from(await file.arrayBuffer());
    photos.push({
      mediaType: file.type as PhotoInput['mediaType'],
      base64: buf.toString('base64'),
    });
  }

  let result;
  try {
    result = await runProfileAudit(photos, bioText);
  } catch (err) {
    console.error('Audit generation failed:', err);
    return NextResponse.json(
      { error: 'The audit could not be generated. Try again in a moment.' },
      { status: 502 }
    );
  }

  try {
    await query(
      'insert into audits (id, user_id, bio_text, photo_count, result) values (?, ?, ?, ?, ?)',
      [randomUUID(), userId, bioText ?? null, photos.length, JSON.stringify(result)]
    );
  } catch (err) {
    // Don't fail the response if persistence fails — the user still gets their result.
    console.error('Failed to persist audit:', err);
  }

  return NextResponse.json(result);
}
