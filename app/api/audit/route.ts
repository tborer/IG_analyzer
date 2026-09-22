import { randomUUID } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserId } from '@/lib/auth';
import { query } from '@/lib/db';
import { runProfileAudit, PhotoInput } from '@/lib/anthropic';
import { canRunAudit, getEffectivePlan, getSubscriptionStatus } from '@/lib/rate-limit';
import { checkBioStaleness } from '@/lib/bio-staleness';
import { trackEvent } from '@/lib/analytics';

const PRIOR_BIOS_TO_CHECK = 5;

const MAX_PHOTOS = 12;
const MAX_BYTES = 8 * 1024 * 1024; // 8MB per-photo safety ceiling
const MAX_TOTAL_BYTES = 4 * 1024 * 1024; // stay under Vercel's Route Handler request-body ceiling
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const DEFAULT_PLATFORM = 'Instagram';

export async function POST(req: NextRequest) {
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ error: 'Sign in to run an audit.' }, { status: 401 });
  }

  const { allowed, reason } = await canRunAudit(userId);
  if (!allowed) {
    // §4.11: a past_due user needs to know *why* they're blocked -- a
    // billing problem, not the free-tier wall -- distinctly from a free
    // user's generic upgrade nudge.
    const subscriptionStatus = await getSubscriptionStatus(userId);
    if (subscriptionStatus === 'past_due') {
      return NextResponse.json(
        {
          error: 'There was a problem with your last payment. Update your billing details to keep your paid plan active.',
          billingIssue: true,
        },
        { status: 429 }
      );
    }
    if (reason === 'daily_cap') {
      return NextResponse.json(
        { error: "You've hit today's audit limit. Try again tomorrow." },
        { status: 429 }
      );
    }
    const plan = await getEffectivePlan(userId);
    return NextResponse.json(
      {
        error:
          plan === 'paid'
            ? "You've used all your tokens for this billing period. They refresh when your subscription renews."
            : "You've used your free token. Upgrade for 20 audits a month.",
        upgrade: plan !== 'paid',
      },
      { status: 429 }
    );
  }

  const form = await req.formData();
  const fileEntries = form.getAll('photos').filter((f): f is File => f instanceof File);
  const bio = form.get('bio');
  const bioText = typeof bio === 'string' && bio.trim() ? bio.trim().slice(0, 600) : undefined;
  // Trust the client's platform value only when other platforms are
  // actually enabled -- otherwise ignore it so the UI toggle can't be
  // bypassed by crafting the request directly.
  const otherPlatformsEnabled = process.env.ENABLE_OTHER_PLATFORMS === 'true';
  const platformRaw = form.get('platform');
  const platform =
    otherPlatformsEnabled && typeof platformRaw === 'string' && platformRaw.trim()
      ? platformRaw.trim().slice(0, 40)
      : DEFAULT_PLATFORM;

  if (fileEntries.length === 0) {
    return NextResponse.json({ error: 'Add at least one photo.' }, { status: 400 });
  }
  if (fileEntries.length > MAX_PHOTOS) {
    return NextResponse.json({ error: `Max ${MAX_PHOTOS} photos per audit.` }, { status: 400 });
  }
  const totalBytes = fileEntries.reduce((sum, f) => sum + f.size, 0);
  if (totalBytes > MAX_TOTAL_BYTES) {
    return NextResponse.json(
      { error: 'Total upload is too large. Remove a photo or two and try again.' },
      { status: 413 }
    );
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

  let result, transcribedBio;
  try {
    ({ result, transcribedBio } = await runProfileAudit(photos, bioText, platform));
  } catch (err) {
    console.error('Audit generation failed:', err);
    return NextResponse.json(
      { error: 'The audit could not be generated. Try again in a moment.' },
      { status: 502 }
    );
  }

  let bioStaleness = null;
  if (transcribedBio) {
    try {
      const priorRows = await query<{ transcribed_bio: string | null }>(
        'select transcribed_bio from audits where user_id = ? order by created_at desc limit ?',
        [userId, PRIOR_BIOS_TO_CHECK]
      );
      const priorBios = priorRows.map((row) => row.transcribed_bio ?? '');
      bioStaleness = checkBioStaleness(transcribedBio, priorBios);
    } catch (err) {
      // Not knowing bio history shouldn't block the response.
      console.error('Failed to check bio staleness:', err);
    }
  }
  const finalResult = { ...result, bioStaleness };
  trackEvent('audit_completed');

  try {
    await query(
      'insert into audits (id, user_id, bio_text, photo_count, result, transcribed_bio) values (?, ?, ?, ?, ?, ?)',
      [
        randomUUID(),
        userId,
        bioText ?? null,
        photos.length,
        JSON.stringify(finalResult),
        transcribedBio,
      ]
    );
  } catch (err) {
    // Don't fail the response if persistence fails — the user still gets their result.
    console.error('Failed to persist audit:', err);
  }

  return NextResponse.json(finalResult);
}
