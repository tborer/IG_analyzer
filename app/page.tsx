import Link from 'next/link';
import ScoreDial from '@/components/ScoreDial';
import PageViewTracker from '@/components/PageViewTracker';
import TrackedCtaLink from '@/components/TrackedCtaLink';
import WaitlistModal from '@/components/WaitlistModal';
import ContactModal from '@/components/ContactModal';
import { SITE_NAME, SITE_URL, PAID_PLAN_PRICE } from '@/lib/site';
import { getAllBlogPosts } from '@/lib/blog';

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
  {
    q: 'What do I get with the free plan versus paid?',
    a: 'Every account gets one free audit to try the tool, no card required. Paid is $19.99/mo for 20 audits a month — useful if you want to re-check a profile after making changes, or you\'re auditing more than one profile. Every audit saves to your history either way, so you can compare runs over time.',
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
      offers: [
        {
          '@type': 'Offer',
          name: 'Free',
          price: '0',
          priceCurrency: 'USD',
          description: '1 free audit to try, no card required.',
        },
        {
          '@type': 'Offer',
          name: 'Paid',
          price: PAID_PLAN_PRICE,
          priceCurrency: 'USD',
          description: '20 audits a month, for tracking changes over time.',
        },
      ],
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
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'Home',
          item: `${SITE_URL}/`,
        },
      ],
    },
    {
      '@type': 'SiteNavigationElement',
      name: ['Blog', 'Log in', 'Sign up'],
      url: [`${SITE_URL}/blog`, `${SITE_URL}/login`, `${SITE_URL}/signup`],
    },
  ],
};

export default function LandingPage() {
  const recentPosts = getAllBlogPosts().slice(0, 3);
  const waitlistEnabled = process.env.ENABLE_WAITLIST === 'true';
  const stripePortalUrl = process.env.STRIPE_CUSTOMER_PORTAL_URL;

  return (
    <main className="max-w-3xl mx-auto px-6 py-16 sm:py-24">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <PageViewTracker event="viewed_landing" />

      <header className="flex items-center justify-between mb-20">
        <span className="font-display text-lg tracking-tight">{SITE_NAME}</span>
        <nav className="flex items-center gap-6">
          <Link href="/blog" className="eyebrow text-mist hover:text-bone transition-colors">
            Blog
          </Link>
          <Link href="/login" className="eyebrow text-mist hover:text-bone transition-colors">
            Log in
          </Link>
          {waitlistEnabled && <WaitlistModal />}
          <TrackedCtaLink
            href="/signup"
            event="click_signup"
            eventProps={{ location: 'nav' }}
            className="eyebrow px-4 py-2 rounded-full border border-brass/50 text-brass hover:bg-brass/10 transition-colors"
          >
            Sign up
          </TrackedCtaLink>
        </nav>
      </header>

      <section className="flex flex-col sm:flex-row gap-10 sm:items-center mb-24">
        <div className="flex-1">
          <p className="eyebrow text-brass mb-4">Instagram audit</p>
          <h1 className="font-display text-4xl sm:text-5xl leading-[1.1] mb-6">
            Your Instagram is making — or breaking — your dates.
          </h1>
          <p className="text-bone/75 text-lg leading-relaxed mb-8 max-w-lg">
            Screenshot your profile — the photos don&apos;t need to be on your device. Get a
            specific, photo-by-photo breakdown of what&apos;s working, what&apos;s missing, and
            exactly what separates a forgettable grid from a different caliber of match.
          </p>
          <TrackedCtaLink
            href="/signup"
            event="click_signup"
            eventProps={{ location: 'hero' }}
            className="inline-block px-6 py-3 bg-brass text-ink font-medium rounded-lg hover:bg-brass/90 transition-colors"
          >
            Get your free audit
          </TrackedCtaLink>
          <p className="eyebrow text-mist mt-3">1 free audit to start — no card required</p>
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
              body: (
                <>
                  Scored, photo by photo, with what to fix and what kind of photo you&apos;re
                  missing entirely — plus a{' '}
                  <Link
                    href="/blog/instagram-bio-for-dating"
                    className="text-brass hover:text-brass/80 underline underline-offset-2 transition-colors"
                  >
                    full bio review
                  </Link>
                  , not just the photos.
                </>
              ),
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

      <section className="mb-24 border-y border-hair py-12">
        <p className="eyebrow text-brass mb-6">Why trust the audit</p>
        <div className="grid sm:grid-cols-3 gap-8 mb-10">
          {[
            {
              title: 'Photos never stored',
              body: 'Screenshots are analyzed and then discarded. Only the written audit is saved to your account.',
            },
            {
              title: 'Dating-specific criteria',
              body: 'Scored against proven dating-profile photo archetypes and bio structures — not generic "looks nice" aesthetics.',
            },
            {
              title: 'No manipulation tactics',
              body: 'Feedback is grounded in photography and dating-presentation fundamentals, not engagement-baiting tricks.',
            },
          ].map((item) => (
            <div key={item.title}>
              <h3 className="font-display text-base mb-2">{item.title}</h3>
              <p className="text-sm text-bone/70 leading-relaxed">{item.body}</p>
            </div>
          ))}
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 justify-between">
          <p className="text-bone/75 text-sm leading-relaxed max-w-md">
            See exactly what the audit checks for —{' '}
            <Link href="/blog" className="text-brass hover:text-brass/80 underline underline-offset-2 transition-colors">
              read the methodology on the blog
            </Link>
            .
          </p>
          <TrackedCtaLink
            href="/signup"
            event="click_signup"
            eventProps={{ location: 'mid_page' }}
            className="inline-block px-5 py-2.5 border border-brass/40 rounded-lg text-brass hover:bg-brass/10 transition-colors whitespace-nowrap"
          >
            Start your free audit
          </TrackedCtaLink>
        </div>
      </section>

      <section className="mb-24">
        <p className="eyebrow text-brass mb-6">Pricing</p>
        <div className="grid sm:grid-cols-2 gap-6">
          <div className="border border-hair rounded-lg bg-inkraised p-6">
            <p className="eyebrow text-mist mb-2">Free</p>
            <p className="font-display text-2xl mb-1">$0</p>
            <p className="eyebrow text-mist mb-4">1 audit to try</p>
            <p className="text-sm text-bone/70 leading-relaxed mb-6">
              The full audit, no card required — one profile review to see what it finds.
            </p>
            <TrackedCtaLink
              href="/signup"
              event="click_signup"
              eventProps={{ location: 'pricing_free' }}
              className="inline-block px-5 py-2.5 border border-hair rounded-lg hover:border-brass/50 transition-colors"
            >
              Get started free
            </TrackedCtaLink>
          </div>
          <div className="border border-brass/40 rounded-lg bg-brass/5 p-6">
            <p className="eyebrow text-brass mb-2">Paid</p>
            <p className="font-display text-2xl mb-1">
              ${PAID_PLAN_PRICE}<span className="text-base font-body text-bone/50">/mo</span>
            </p>
            <p className="eyebrow text-mist mb-4">20 audits / month</p>
            <p className="text-sm text-bone/70 leading-relaxed mb-6">
              Track your progress as you make changes, or audit more than one profile — 20
              runs a month to work with instead of one.
            </p>
            <TrackedCtaLink
              href="/signup"
              event="click_signup"
              eventProps={{ location: 'pricing_paid' }}
              className="inline-block px-5 py-2.5 bg-brass text-ink font-medium rounded-lg hover:bg-brass/90 transition-colors"
            >
              Sign up to upgrade
            </TrackedCtaLink>
          </div>
        </div>
      </section>

      <section className="mb-24">
        <h2 className="font-display text-2xl mb-8">Questions</h2>
        <div className="divide-y divide-hair border-t border-b border-hair">
          {FAQ.map((item, i) => (
            <details key={item.q} className="group py-5" open={i === 0}>
              <summary className="flex items-center justify-between gap-4 cursor-pointer list-none font-display text-lg">
                {item.q}
                <span className="shrink-0 text-brass transition-transform group-open:rotate-45 font-mono text-xl leading-none">
                  +
                </span>
              </summary>
              <p className="text-sm text-bone/70 leading-relaxed mt-3">{item.a}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="mb-24">
        <div className="flex items-center justify-between mb-6">
          <p className="eyebrow text-brass">From the blog</p>
          <Link href="/blog" className="eyebrow text-mist hover:text-bone transition-colors">
            View all
          </Link>
        </div>
        <div className="grid sm:grid-cols-3 gap-6">
          {recentPosts.map((post) => (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              className="block border border-hair rounded-lg p-5 hover:border-brass/40 transition-colors"
            >
              <h3 className="font-display text-base mb-2 leading-snug">{post.title}</h3>
              <p className="text-xs text-bone/60 leading-relaxed">{post.description}</p>
            </Link>
          ))}
        </div>
      </section>

      <footer className="border-t border-hair pt-8 text-sm text-mist">
        <p className="leading-relaxed mb-6 max-w-lg">
          Feedback is generated to be specific and actionable — grounded in photography and
          dating-presentation fundamentals, not manipulation tactics. Screenshots are never
          stored; only the written audit is.
        </p>
        <nav className="flex flex-wrap items-center gap-x-6 gap-y-2 eyebrow">
          <Link href="/blog" className="hover:text-bone transition-colors">
            Blog
          </Link>
          <Link href="/comparison" className="hover:text-bone transition-colors">
            Comparison
          </Link>
          <Link href="/privacy" className="hover:text-bone transition-colors">
            Privacy
          </Link>
          <Link href="/terms" className="hover:text-bone transition-colors">
            Terms
          </Link>
          {stripePortalUrl && (
            <a href={stripePortalUrl} className="hover:text-bone transition-colors">
              Manage billing
            </a>
          )}
          <ContactModal />
        </nav>
      </footer>
    </main>
  );
}