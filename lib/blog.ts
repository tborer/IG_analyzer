// Blog content lives here as plain TypeScript data rather than MDX/a CMS --
// matches this codebase's "no CMS, hand-rolled" convention (see AGENTS.md)
// and keeps a handful of launch articles easy to edit without a new build
// dependency. Revisit an MDX/CMS pipeline only if publishing cadence grows
// past what's comfortable maintaining as data here.

export type BlogBlock =
  | { type: 'p'; text: string }
  | { type: 'h2'; text: string }
  | { type: 'ul'; items: string[] }
  | { type: 'quote'; text: string };

export type BlogPost = {
  slug: string;
  title: string;
  description: string;
  publishedAt: string;
  readingTime: string;
  body: BlogBlock[];
};

export const BLOG_POSTS: BlogPost[] = [
  {
    slug: 'instagram-bio-for-dating',
    title: 'The Instagram Bio Checklist Daters Actually Read',
    description:
      "The bio patterns that quietly kill interest, the ones that build it, and the five bio structures that actually work — grounded in what Caliber's audit checks for.",
    publishedAt: '2026-09-01',
    readingTime: '5 min read',
    body: [
      {
        type: 'p',
        text: "Most Instagram bios written for dating fall into the same trap: they try to sound impressive instead of giving someone something real to respond to. A bio isn't a resume — it's the one line of text someone reads right before deciding whether to swipe back, or whether to keep scrolling your grid at all. Here's what actually works, and what quietly works against you.",
      },
      { type: 'h2', text: 'The patterns that read as a red flag' },
      {
        type: 'p',
        text: "Some phrasing has been used so often in dating-app bios that it's stopped signaling anything except that you copied a template. These are the ones worth cutting first:",
      },
      {
        type: 'ul',
        items: [
          'Quotes — from philosophers, rappers, or "king/queen" phrasing',
          'Height, age, or zodiac sign listed like a spec sheet',
          'Mile counts or fitness stats with no context',
          'Unverifiable titles ("Entrepreneur / CEO / Visionary") with nothing backing them up',
          '"DM for collab" with no audience to justify it',
          '"Don\'t DM me unless you\'re serious"',
          'Religious or political signaling in a two-line bio',
          'Availability language — "Single," "DTF," "looking for my person"',
        ],
      },
      {
        type: 'p',
        text: "None of these are disqualifying on their own, but they crowd out space that could be doing real work — giving someone a genuine reason to ask a question. A bio with two of these and nothing else reads as generic, even if every individual line seemed fine when you wrote it.",
      },
      { type: 'h2', text: 'Five bio structures that actually work' },
      {
        type: 'p',
        text: 'Rather than freestyling, most bios that work fit one of a handful of proven shapes. Pick the one closest to your actual life and fill it in specifically — vague versions of any of these fail just as hard as no structure at all.',
      },
      {
        type: 'ul',
        items: [
          'Professional — role • city • interest ("Structural engineer • Denver • building furniture badly on weekends")',
          'Entrepreneur — company or industry • city • credibility marker (something that proves it, not just claims it)',
          'Traveler — home base • current location • interest',
          'Creative — craft • notable work • city',
          'Minimal — three interests or roles, dot-separated, no filler',
        ],
      },
      {
        type: 'p',
        text: "The common thread across all five: specificity. \"Building furniture badly on weekends\" gives someone an opening line. \"Loves to travel\" doesn't — it applies to roughly everyone with a passport and a Wi-Fi connection.",
      },
      { type: 'h2', text: "One more thing that's easy to miss: staleness" },
      {
        type: 'p',
        text: "A bio that hasn't changed in two years signals something even if the words themselves are fine — that nothing in your life has moved. It doesn't need to change often, but if you haven't looked at it since you wrote it, that's worth five minutes right now.",
      },
      {
        type: 'quote',
        text: 'A dynamic bio signals an active life; a static one signals nothing is happening.',
      },
      {
        type: 'p',
        text: "Caliber's audit checks your bio against all of this automatically — the red-flag list, which of the five structures you're closest to, and whether it reads as stale — alongside a full photo-by-photo review of your grid.",
      },
    ],
  },
  {
    slug: 'instagram-grid-strategy-matching',
    title: 'What Your Instagram Grid Says About You in the First 3 Seconds',
    description:
      'Before anyone reads a caption, they scan your grid. Here is the coverage checklist that separates a grid that works from one that reads as an afterthought.',
    publishedAt: '2026-09-08',
    readingTime: '6 min read',
    body: [
      {
        type: 'p',
        text: "By the time someone finishes scrolling nine photos on your profile, they've already formed an opinion — before reading a single caption, before your bio even registers. That opinion is built almost entirely from pattern-matching against a handful of photo types. Miss too many of them, and the grid reads as an afterthought even if every individual photo is technically good.",
      },
      { type: 'h2', text: 'The eight photo types worth having' },
      {
        type: 'p',
        text: "Dating-profile photography has a well-documented set of archetypes that consistently perform, because each one answers a different question someone is unconsciously asking. Caliber scores every photo in an upload against this exact list and flags which ones are missing entirely:",
      },
      {
        type: 'ul',
        items: [
          'Solo close-up — face clarity, no sunglasses or group crop hiding who you are',
          'Full body — at least one, so there is no mystery or bait-and-switch at a first meeting',
          'Social / with others — proof you have a life with people in it',
          'Activity or hobby — something you actually do, not a stock-photo gym mirror shot',
          'Travel or adventure — context, not just the destination',
          'Candid / genuine expression — a real reaction, not a posed lean-in',
          'Pet — if you have one; it consistently reads well and rarely hurts',
          'Style or professional — one photo that shows you put effort into how you present',
        ],
      },
      { type: 'h2', text: 'A grid of eight nearly-identical photos is a red flag' },
      {
        type: 'p',
        text: 'The most common grid mistake is not a bad individual photo — it is repetition. Eight photos in the same outfit at the same bar, all shot from the same angle, tell someone you either don\'t have much going on outside that one setting, or that you don\'t have anyone in your life to take a different kind of photo. Variety across the archetypes above does more for a grid\'s first impression than any single "best" photo could.',
      },
      { type: 'h2', text: 'What the audit actually checks beyond individual photos' },
      {
        type: 'p',
        text: 'Grid cohesion matters as its own thing, separate from the individual photos. So does what is missing from the wider profile — not just the grid, but the bio and header, individual post captions, highlights or pinned content, and any video or Reels content. A grid can score well photo-by-photo and still leave a profile that reads as thin if half of that surface area is empty.',
      },
      {
        type: 'p',
        text: 'A specific, photo-by-photo breakdown — what is working, what is missing, and exactly which archetype to shoot next — is what Caliber\'s audit produces from a set of screenshots. No need to dig up or re-upload original photos.',
      },
    ],
  },
  {
    slug: 'dating-profile-audit-checklist',
    title: 'The Dating Profile Audit Checklist',
    description:
      'A complete, no-fluff checklist for auditing your own Instagram before someone else does it for you — photos, bio, coverage, and the mistakes that are easy to miss from the inside.',
    publishedAt: '2026-09-15',
    readingTime: '7 min read',
    body: [
      {
        type: 'p',
        text: "It's genuinely hard to see your own profile the way a stranger does. You know the context behind every photo, so gaps that are obvious to an outsider are invisible to you. This checklist is the same structure Caliber's audit runs through automatically — useful even if you're doing it yourself with fresh eyes.",
      },
      { type: 'h2', text: '1. Photo archetype coverage' },
      {
        type: 'p',
        text: 'Go through your grid and check off which of these you actually have: solo close-up, full body, social/with others, activity or hobby, travel, candid/genuine expression, pet, and style or professional. Anything missing is a gap worth filling before anything else — a coverage gap generally matters more than making an existing photo slightly better.',
      },
      { type: 'h2', text: '2. Bio red flags' },
      {
        type: 'p',
        text: 'Read your bio as if a stranger wrote it. Does it lean on quotes, height/age/zodiac, mile counts, unverifiable titles, "DM for collab," availability language, or religious/political signaling? Cut what you find. Then check it against a real structure — professional, entrepreneur, traveler, creative, or minimal — rather than leaving it as loose fragments.',
      },
      { type: 'h2', text: '3. Profile-wide coverage, not just the grid' },
      {
        type: 'ul',
        items: [
          'Profile bio / header — does it read as current, and does the avatar clearly show your face?',
          'Grid or feed overview — does it show variety, or repetition?',
          'Individual posts with captions — do captions add anything, or are they empty?',
          'Highlights or pinned content — wasted real estate if left default or empty',
          'Video or Reels content — increasingly part of how a profile gets judged',
        ],
      },
      { type: 'h2', text: '4. The staleness check' },
      {
        type: 'p',
        text: "When did you last post, and when did you last change your bio? Neither needs to happen constantly, but both going untouched for a long stretch reads as an inactive life, whether or not that's actually true.",
      },
      { type: 'h2', text: "5. What you can't see from the inside" },
      {
        type: 'p',
        text: 'This is the part self-review can\'t fully replace: it\'s hard to score your own photos against dating-specific archetypes objectively, and easy to miss your own bio red flags because you know the context that makes each line feel justified. That\'s the specific gap Caliber\'s audit is built to close — screenshot your profile, and get a photo-by-photo, bio-by-bio breakdown scored against exactly this checklist.',
      },
    ],
  },
];

export function getAllBlogPosts(): BlogPost[] {
  return [...BLOG_POSTS].sort((a, b) => (a.publishedAt < b.publishedAt ? 1 : -1));
}

export function getBlogPostBySlug(slug: string): BlogPost | undefined {
  return BLOG_POSTS.find((post) => post.slug === slug);
}
