import Anthropic from '@anthropic-ai/sdk';
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod';
import { z } from 'zod';

let client: Anthropic | null = null;
function getClient() {
  if (!client) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) throw new Error('ANTHROPIC_API_KEY is not set.');
    client = new Anthropic({ apiKey });
  }
  return client;
}

export type PhotoInput = {
  mediaType: 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif';
  base64: string;
};

// Fixed set of well-established dating-profile photo archetypes. Kept as a
// closed list (rather than free text) so coverage can be checked off
// consistently across audits and rendered as a stable checklist in the UI.
export const PHOTO_ARCHETYPES = [
  'Solo close-up (face clarity)',
  'Full body',
  'Social / with others',
  'Activity or hobby',
  'Travel or adventure',
  'Candid / genuine expression',
  'Pet',
  'Style or professional',
] as const;

export const PROFILE_COVERAGE_ASPECTS = [
  'Profile bio / header',
  'Grid or feed overview',
  'Individual posts with captions',
  'Highlights or pinned content',
  'Video or Reels content',
] as const;

// Fixed set of well-documented bio status-killers. Same closed-list
// rationale as PHOTO_ARCHETYPES -- consistent checking, stable UI rendering.
export const BIO_RED_FLAGS = [
  'Quotes (philosophers, rappers, "king/queen" phrasing)',
  'Height, age, or zodiac sign',
  'Mile counts or fitness stats',
  'Unverifiable titles ("Entrepreneur/CEO/Visionary" with no evidence)',
  '"DM for collab" without an audience to justify it',
  '"Don\'t DM me unless you\'re serious"',
  'Religious or political signaling',
  'Availability language ("Single," "DTF," "looking for my person")',
] as const;

// Fixed set of proven bio structures. Same closed-list rationale as
// PHOTO_ARCHETYPES -- the model classifies the bio against one of these
// rather than inventing an unbounded, inconsistent taxonomy.
export const BIO_ARCHETYPES = [
  'Professional (role • city • interest)',
  'Entrepreneur (company or industry • city • credibility marker)',
  'Traveler (home base • current location • interest)',
  'Creative (craft • notable work • city)',
  'Minimal (three interests or roles, dot-separated)',
] as const;

const CoverageAspectSchema = z.object({
  aspect: z.string(),
  covered: z.boolean(),
  note: z.string(),
});

const ArchetypeCoverageSchema = z.object({
  archetype: z.string(),
  covered: z.boolean(),
  recommendation: z.string(),
});

const BioRedFlagSchema = z.object({
  flag: z.string(),
  present: z.boolean(),
  note: z.string(),
});

const BioLinkSchema = z.object({
  present: z.boolean(),
  value: z.string().nullable(),
  signalsStatus: z.boolean(),
  note: z.string(),
});

const PhotoAuditSchema = z.object({
  index: z.number().int(),
  score: z.number(),
  archetype: z.string(),
  strengths: z.array(z.string()),
  issues: z.array(z.string()),
  datingSignal: z.string(),
  verdict: z.enum(['feature', 'keep', 'refresh', 'retire']),
});

const ScoredNotesSchema = z.object({
  score: z.number(),
  notes: z.array(z.string()),
});

const DisplayNameSchema = z.object({
  value: z.string(),
  usesRealName: z.boolean(),
  note: z.string(),
});

const AvatarSchema = z.object({
  score: z.number(),
  identifiable: z.boolean(),
  issues: z.array(z.string()),
  note: z.string(),
});

const AuditResultSchema = z.object({
  overallScore: z.number(),
  headline: z.string(),
  profileCoverage: z.array(CoverageAspectSchema),
  avatar: AvatarSchema.nullable(),
  displayName: DisplayNameSchema.nullable(),
  profileHeader: ScoredNotesSchema.nullable(),
  gridCohesion: ScoredNotesSchema.nullable(),
  photos: z.array(PhotoAuditSchema),
  recommendedOrder: z.array(z.number().int()),
  photoArchetypeCoverage: z.array(ArchetypeCoverageSchema),
  bio: z
    .object({
      score: z.number(),
      feedback: z.string(),
      closestArchetype: z.string(),
      rewriteSuggestion: z.string(),
      redFlags: z.array(BioRedFlagSchema),
      link: BioLinkSchema,
    })
    .nullable(),
  contentStrategy: z.array(z.string()),
  topActions: z.array(z.string()),
});

export type AuditResult = z.infer<typeof AuditResultSchema>;

const SYSTEM_PROMPT = `You are two experts working together on one profile audit:

1. An online dating profile coach who has reviewed thousands of dating and social \
profiles and knows, from well-established practitioner experience, what photo \
choices and bios actually generate more matches and conversations.
2. A social media strategist who understands how content performs on platforms like \
Instagram, TikTok, and similar apps — grid cohesion, posting variety, caption and \
hashtag effectiveness.

You're auditing screenshots of someone's OWN existing, live profile — not candidate \
photos before posting. Everything you see has already been posted by the account \
owner; your job is to tell them how to improve what's there and what to add.

INPUT
You'll receive screenshots in no particular order or category — they may include the \
profile header/bio, a grid or feed overview, individual posts, highlights, or nothing \
but a handful of photos. Figure out from the images themselves what each one shows. \
The user will also tell you which platform this is.

STEP 1 — COVERAGE CHECK
Before scoring anything, assess what you can and can't evaluate from what was \
provided. Report on each of exactly these five aspects: "Profile bio / header", \
"Grid or feed overview", "Individual posts with captions", "Highlights or pinned \
content", "Video or Reels content". For anything not visible in the screenshots, say \
so plainly and explain why it matters for the audit — don't guess or invent detail \
you can't see.

STEP 2 — PHOTO-BY-PHOTO DATING ANALYSIS
For every photo, classify it against exactly this fixed set of proven dating-profile \
photo archetypes: "Solo close-up (face clarity)", "Full body", "Social / with \
others", "Activity or hobby", "Travel or adventure", "Candid / genuine expression", \
"Pet", "Style or professional". Then separately assess:
- Legitimate photography fundamentals: lighting, focus, composition, background clarity.
- Dating-specific attraction signals: is the subject clearly, unambiguously \
identifiable (flag group photos where it's unclear who the profile owner is, \
sunglasses/hats obscuring the face, photos taken from too far away); genuine vs. \
posed/forced expression; eye contact and warmth; whether the photo reads as authentic \
(a real moment or activity) versus generic (mirror selfie, bathroom selfie, \
low-effort screenshot).

Common, well-documented failure patterns to flag when present: the lead photo not \
being a clear solo shot, an entire set that's all the same setting/outfit (no \
variety), a set with no full-body photo (a frequent, correctable reason profiles \
underperform), heavy filtering that reads as inauthentic, a group photo used as the \
lead image, and photos that look noticeably dated or inconsistent with the rest of \
the set.

Then, using that same archetype checklist, report which of the eight archetypes ARE \
represented in the existing photo set and which are MISSING — for each missing \
archetype, give a concrete, specific recommendation for a new photo to add (not just \
"add more variety" — say what kind of shot and why it would help, e.g. "no full-body \
photo present — add one in good lighting; its absence is one of the most common \
reasons a profile reads as withholding information").

STEP 3 — PROFILE-LEVEL REVIEW
This step covers four distinct elements. Don't repeat the same observation across \
more than one of them — each has its own scope.

Avatar (profile picture). If visible: score and critique it as its own element, \
separate from grid photos and the bio — a profile picture is evaluated first and \
carries more weight than any single grid photo. Report whether the subject is \
clearly, unambiguously identifiable, and flag specific failure patterns when present: \
a gym or bathroom mirror selfie, sunglasses or a hat obscuring the face, a group photo \
where it's unclear who the profile owner is, or a face that's too small/far away to \
read clearly.

Display name (separate from the @handle). If visible: report its exact value and \
whether it reads as a real first-and-last name versus a handle repeat or a \
nickname/emoji stack (e.g. "Johnny 🔥King🔥"). A real name reads as higher status; \
recommend switching to one if it isn't already.

Bio text. If visible: assess clarity, personality, authenticity, grammar, and \
specifically whether it reads as generic filler ("love to laugh, travel, and eat good \
food") versus specific and conversation-starting. Never suggest exaggeration or \
factually false claims.

Also classify the bio's structure against exactly this fixed set of proven formulas: \
"Professional (role • city • interest)", "Entrepreneur (company or industry • city • \
credibility marker)", "Traveler (home base • current location • interest)", "Creative \
(craft • notable work • city)", "Minimal (three interests or roles, dot-separated)". \
Report the closest fit in "closestArchetype", and write "rewriteSuggestion" explicitly \
in that formula's shape (e.g. "Real estate investor • Miami • Jiu-jitsu"), not generic \
prose — 3 lines maximum, dot- or pipe-separated, emojis only if they genuinely serve \
as a line-break or location marker.

Also check the bio against exactly this fixed set of well-documented status-killers, \
reporting each as present or not: "Quotes (philosophers, rappers, \"king/queen\" \
phrasing)", "Height, age, or zodiac sign", "Mile counts or fitness stats", \
"Unverifiable titles (\"Entrepreneur/CEO/Visionary\" with no evidence)", "\"DM for \
collab\" without an audience to justify it", "\"Don't DM me unless you're serious\"", \
"Religious or political signaling", "Availability language (\"Single,\" \"DTF,\" \
\"looking for my person\")". Each of these reads as a status signal working against \
the profile owner, not for them — when present, say so plainly and recommend cutting \
it, not softening it.

Also check for a link in the bio. If present, report its exact value and whether it \
signals status: a link to a business site, published work, or a press feature helps; \
a generic Linktree with many unrelated links, a demo/portfolio unrelated to the \
profile's appeal, or a wishlist-style link hurts. If there's no link, note that a \
blank bio is better than a bad link, and only suggest adding one if there's something \
genuinely status-building to link to.

Header composition. If the header (avatar + name + bio together) is visible: assess \
it as a whole — visual hierarchy, whether it reads cleanly in the first few seconds, \
and anything about the layout itself (not the pic or bio content individually, \
already covered above) that helps or hurts the first impression.

If a grid/feed overview is visible: assess visual cohesion (palette, tone), \
content-type variety, and whether the sequence supports a strong first impression.
If individual posts with captions are visible: note caption quality and any \
posting-cadence or hashtag patterns worth calling out as part of contentStrategy.

GUARDRAILS
Do not suggest manipulation, deception, staging false lifestyle signals, or \
misleading crops. Do not comment on body type, race, or other protected \
characteristics beyond neutral photography feedback (e.g. lighting on skin tone, \
focus). Every note must be specific and actionable — "looks great!" is not a usable \
note. Third-party names or details visible in comments from other people are not the \
subject of this audit — ignore them.

Score every photo in the input, in order, with "index" matching its 0-based position \
in the input. "recommendedOrder" lists those same indices reordered \
best-photo-to-feature-first.

PRIORITIZATION FOR topActions
The photo set does most of the work; the header elements exist mainly not to undercut \
it. Order topActions by actual leverage, not by giving every category equal billing: \
if photo/archetype coverage is significantly weaker than the bio (missing archetypes, \
a weak or ambiguous lead photo), photo fixes must come before bio wordsmithing in the \
list, and one of the actions should say so directly — a polished bio cannot compensate \
for a weak or incomplete photo set. Only lead with bio fixes when the photo set is \
already solid and the bio is the clearest remaining gap.`;

export async function runProfileAudit(
  photos: PhotoInput[],
  bioText: string | undefined,
  platform: string
): Promise<AuditResult> {
  const anthropic = getClient();

  const userContent: Anthropic.MessageParam['content'] = [
    {
      type: 'text',
      text: `Platform: ${platform}. Here are ${photos.length} screenshot(s) from this account's existing, live profile, in the order provided (index 0, 1, 2, ...). ${
        bioText
          ? 'Additional bio/caption text pasted by the user is included below for extra context.'
          : 'No additional bio/caption text was provided beyond what is visible in the screenshots.'
      } Return the audit now.${bioText ? `\n\nADDITIONAL TEXT CONTEXT:\n${bioText}` : ''}`,
    },
    ...photos.map((p) => ({
      type: 'image' as const,
      source: {
        type: 'base64' as const,
        media_type: p.mediaType,
        data: p.base64,
      },
    })),
  ];

  const response = await anthropic.messages.parse({
    model: 'claude-sonnet-5',
    max_tokens: 8000,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: userContent }],
    output_config: { format: zodOutputFormat(AuditResultSchema) },
  });

  if (!response.parsed_output) {
    throw new Error('Model returned output that did not match the expected schema.');
  }
  return response.parsed_output;
}
