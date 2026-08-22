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

const PhotoAuditSchema = z.object({
  index: z.number().int(),
  score: z.number(),
  strengths: z.array(z.string()),
  issues: z.array(z.string()),
  verdict: z.enum(['lead', 'keep', 'cut', 'replace']),
});

const AuditResultSchema = z.object({
  overallScore: z.number(),
  headline: z.string(),
  photos: z.array(PhotoAuditSchema),
  recommendedOrder: z.array(z.number().int()),
  bio: z
    .object({
      score: z.number(),
      feedback: z.string(),
      rewriteSuggestion: z.string(),
    })
    .nullable(),
  topActions: z.array(z.string()),
});

export type AuditResult = z.infer<typeof AuditResultSchema>;

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

Score every photo in the input, in order, with "index" matching its 0-based position in the \
input. "recommendedOrder" lists those same indices reordered best-lead-photo-first.`;

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
      } Return the audit now.${bioText ? `\n\nBIO:\n${bioText}` : ''}`,
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
    max_tokens: 4000,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: userContent }],
    output_config: { format: zodOutputFormat(AuditResultSchema) },
  });

  if (!response.parsed_output) {
    throw new Error('Model returned output that did not match the expected schema.');
  }
  return response.parsed_output;
}
