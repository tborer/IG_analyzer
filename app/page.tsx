import Link from 'next/link';
import ScoreDial from '@/components/ScoreDial';
import { SITE_NAME } from '@/lib/site';

const FAQ = [
  {
    q: 'Does my Instagram actually matter for dating?',
    a: "Increasingly, yes. Before a first date — or before someone swipes back — most people check the other person's Instagram, not just their dating-app profile. A grid that reads as an afterthought works against you before you've said a word.",
  },
  {
    q: 'What makes an Instagram profile attractive for dating?',
    a: 'Specific things: a clear, identifiable lead photo; a set that shows more than one context, not eight photos in the same outfit at the same bar; at least one full-body shot; genuine expressions over posed ones; and a bio that gives someone something real to ask about. Caliber checks your profile against all of it.',
  },
  {
    q: 'Is this the same as a Tinder or Hinge photo review?',
    a: "No — most photo-review tools grade pictures you're considering uploading to a dating app. Caliber audits the Instagram you already have, because that's what people actually look at once you've matched.",
  },
  {
    q: 'Do you store my screenshots?',
    a: 'No. Screenshots are analyzed and then discarded — only the written audit is saved to your account, so you can look back at it later.',
  },
];

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebApplication',
      name: SITE_NAME,
      applicationCategory: 'LifestyleApplication',
      operatingSystem: 'Web',
      description:
        "An Instagram profile audit for dating — photo-by-photo scoring, coverage gaps, and what to add to attract a different caliber of match.",
    },
    {
      '@type': 'FAQPage',
      mainEntity: FAQ.map((item) => ({
        '@type': 'Question',
        name: item.q,
        acceptedAnswer: {
          '@type': 'Answer',
          text: item.a,
        },
      })),
    },
  ],
};

export default function LandingPage() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-16 sm:py-24">
      {/* eslint-disable-next-line react/no-danger */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <header className="flex items-center justify-between mb-20">
        <span className="font-display text-lg tracking-tight">{SITE_NAME}</span>
        <nav className="flex items-center gap-6">
          <Link href="/login" className="eyebrow text-mist hover:text-bone transition-colors">
            Log in
          </Link>
          <Link
            href="/signup"
            className="eyebrow px-4 py-2 rounded-full border border-brass/50 text-brass hover:bg-brass/10 transition-colors"
          >
            Sign up
          </Link>
        </nav>
      </header>

      <section className="flex flex-col sm:flex-row gap-10 sm:items-center mb-24">
        <div className="flex-1">
          <p className="eyebrow text-brass mb-4">Instagram audit</p>
          <h1 className="font-display text-4xl sm:text-5xl leading-[1.1] mb-6">
            {SITE_NAME} audits the Instagram people check before a first date.
          </h1>
          <p className="text-bone/75 text-lg leading-relaxed mb-8 max-w-lg">
            Screenshot your profile — the photos don't need to be on your device. Get a
            specific, photo-by-photo breakdown of what's working, what's missing, and
            exactly what separates a forgettable grid from a different caliber of match.
          </p>
          <Link
            href="/signup"
            className="inline-block px-6 py-3 bg-brass text-ink font-medium rounded-lg hover:bg-brass/90 transition-colors"
          >
            Unlock your audit
          </Link>
        </div>
        <div className="shrink-0 flex flex-col items-center gap-2 border border-hair rounded-lg bg-inkraised p-8">
          <ScoreDial score={82} size={120} />
          <p className="eyebrow text-mist mt-2">Example score</p>
        </div>
      </section>

      <section className="mb-24">
        <p className="eyebrow text-brass mb-6">How it works</p>
        <div className="grid sm:grid-cols-3 gap-8">
          {[
            {
              n: '01',
              title: 'Screenshot your profile',
              body: 'Your bio, your grid, a handful of posts. No need to dig up the original photos.',
            },
            {
              n: '02',
              title: 'Upload and pick a platform',
              body: 'Instagram, TikTok, or anywhere else — the audit adapts to what you give it.',
            },
            {
              n: '03',
              title: 'Get the specific audit',
              body: "Scored, photo by photo, with what to fix and what kind of photo you're missing entirely.",
            },
          ].map((item) => (
            <div key={item.n}>
              <p className="font-mono text-brass mb-2">{item.n}</p>
              <h3 className="font-display text-lg mb-2">{item.title}</h3>
              <p className="text-sm text-bone/70 leading-relaxed">{item.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="grid sm:grid-cols-3 gap-8 mb-24">
        {[
          {
            n: '01',
            title: 'Dating-photo logic, not just "looks nice"',
            body: 'Every photo scored against proven dating-profile archetypes — and told what type you\'re missing entirely.',
          },
          {
            n: '02',
            title: 'What the audit could actually see',
            body: 'A coverage check on your bio, grid, posts, and highlights — so you know what to add for a fuller picture.',
          },
          {
            n: '03',
            title: 'Bio and content strategy, reviewed too',
            body: 'Copywriting feedback plus posting-cadence and hashtag notes, grounded in what actually drives engagement.',
          },
        ].map((item) => (
          <div key={item.n}>
            <p className="font-mono text-brass mb-2">{item.n}</p>
            <h3 className="font-display text-lg mb-2">{item.title}</h3>
            <p className="text-sm text-bone/70 leading-relaxed">{item.body}</p>
          </div>
        ))}
      </section>

      <section className="mb-24">
        <h2 className="font-display text-2xl mb-8">Questions</h2>
        <div className="space-y-8">
          {FAQ.map((item) => (
            <div key={item.q}>
              <h3 className="font-display text-lg mb-2">{item.q}</h3>
              <p className="text-sm text-bone/70 leading-relaxed">{item.a}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-hair pt-8 text-sm text-mist">
        Feedback is generated to be specific and actionable — grounded in photography and
        dating-presentation fundamentals, not manipulation tactics.
      </footer>
    </main>
  );
}
