import Anthropic from '@anthropic-ai/sdk';

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

export type AuditResult = {
  overallScore: number;
  headline: string;
  photos: Array<{
    index: number;
    score: number;
    strengths: string[];
    issues: string[];
    verdict: 'lead' | 'keep' | 'cut' | 'replace';
  }>;
  recommendedOrder: number[];
  bio: {
    score: number;
    feedback: string;
    rewriteSuggestion: string;
  } | null;
  topActions: string[];
};

const SYSTEM_PROMPT = `You are a professional photography and self-presentation consultant \
reviewing a set of photos someone is considering for a dating profile or social profile, \
along with an optional bio. You give the kind of honest, specific, constructive feedback a \
skilled portrait photographer or image consultant would give a paying client.

Evaluate each photo on legitimate, well-established factors: lighting quality, composition \
and framing, image resolution/blur, background clarity and clutter, genuineness of \
expression, whether the subject is clearly identifiable (flag group photos, sunglasses, or \
photos taken from too far away), variety across the set (avoid recommending near-duplicates), \
grooming and clothing fit/presentation, and whether the photo communicates something authentic \
about the person (an activity, setting, or context) versus a generic mirror selfie.

Do not suggest manipulation, deception, staging false lifestyle signals, or misleading crops. \
Do not comment on body type, race, or other protected characteristics beyond what's needed for \
neutral photography feedback (e.g. lighting on skin tone, focus). Keep every note specific and \
actionable, never generic ("looks great!" is not useful).

For the bio (if provided), evaluate clarity, personality, authenticity, grammar, and whether it \
gives someone an easy, genuine way to start a conversation. Never suggest exaggeration or \
factually false claims.

Respond with ONLY valid JSON (no markdown fences, no commentary) matching exactly this shape:
{
  "overallScore": number (0-100),
  "headline": string (one sentence, direct verdict),
  "photos": [
    {
      "index": number (0-based, matching input order),
      "score": number (0-100),
      "strengths": string[] (0-3 items),
      "issues": string[] (0-3 items),
      "verdict": "lead" | "keep" | "cut" | "replace"
    }
  ],
  "recommendedOrder": number[] (photo indices in the order they should appear, best lead photo first),
  "bio": { "score": number, "feedback": string, "rewriteSuggestion": string } or null if no bio was given,
  "topActions": string[] (3-5 prioritized, concrete next steps)
}`;

export async function runProfileAudit(
  photos: PhotoInput[],
  bioText: string | undefined
): Promise<AuditResult> {
  const anthropic = getClient();

  const userContent: Anthropic.MessageParam['content'] = [
    {
      type: 'text',
      text: `Here are ${photos.length} candidate photo(s), in the order provided (index 0, 1, 2, ...). ${
        bioText ? 'A bio is also included below.' : 'No bio was provided.'
      } Return the JSON audit now.${bioText ? `\n\nBIO:\n${bioText}` : ''}`,
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

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-5',
    max_tokens: 4000,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: userContent }],
  });

  const textBlock = response.content.find((b) => b.type === 'text');
  if (!textBlock || textBlock.type !== 'text') {
    throw new Error('Model returned no text content.');
  }

  const cleaned = textBlock.text.trim().replace(/^```json\s*|\s*```$/g, '');
  let parsed: AuditResult;
  try {
    parsed = JSON.parse(cleaned);
  } catch (err) {
    throw new Error('Failed to parse model output as JSON: ' + (err as Error).message);
  }
  return parsed;
}
