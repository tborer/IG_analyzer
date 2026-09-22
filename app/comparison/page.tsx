import Link from 'next/link';
import { Metadata } from 'next';
import { SITE_NAME } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Caliber vs. Photo-Review Tools',
  description:
    'How an Instagram profile audit differs from a Tinder/Hinge photo-review tool — and why the profile you already have matters more than the photos you upload.',
  alternates: { canonical: '/comparison' },
};

const ROWS: [string, string, string][] = [
  ['What it looks at', 'Your existing Instagram — bio, grid, posts, highlights', 'A handful of candidate photos you upload for a dating app'],
  ['What it\'s scored against', 'Dating-profile photo archetypes and bio structure', 'Usually a generic attractiveness/quality score'],
  ['Bio review', 'Full bio audit — red flags, archetype fit, staleness', 'Not typically covered'],
  ['Coverage gaps', 'Flags missing photo types and profile sections', 'Only rates what you already uploaded'],
  ['Free tier', '1 full audit to try, no card required', 'Varies — often paywalled after the first use'],
];

export default function ComparisonPage() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-16 sm:py-24">
      <header className="flex items-center justify-between mb-16">
        <Link href="/" className="font-display text-lg tracking-tight">
          {SITE_NAME}
        </Link>
        <nav className="flex items-center gap-6">
          <Link href="/blog" className="eyebrow text-mist hover:text-bone transition-colors">
            Blog
          </Link>
          <Link
            href="/signup"
            className="eyebrow px-4 py-2 rounded-full border border-brass/50 text-brass hover:bg-brass/10 transition-colors"
          >
            Sign up
          </Link>
        </nav>
      </header>

      <p className="eyebrow text-brass mb-4">How it compares</p>
      <h1 className="font-display text-3xl sm:text-4xl leading-[1.1] mb-6">
        An Instagram audit isn&apos;t a dating-photo review.
      </h1>
      <p className="text-bone/75 text-lg leading-relaxed mb-12 max-w-lg">
        Most photo-review tools grade pictures you&apos;re considering uploading to a dating app.
        {` ${SITE_NAME} `}audits the Instagram profile you already have — because that&apos;s
        what someone actually looks at once you&apos;ve matched, or before a first date.
      </p>

      <div className="border border-hair rounded-lg overflow-hidden mb-16">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-inkraised text-left">
              <th className="p-4 font-display font-normal text-mist">&nbsp;</th>
              <th className="p-4 font-display text-brass">{SITE_NAME}</th>
              <th className="p-4 font-display text-mist">Typical photo-review tool</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-hair">
            {ROWS.map(([label, ours, theirs]) => (
              <tr key={label}>
                <td className="p-4 text-mist align-top whitespace-nowrap">{label}</td>
                <td className="p-4 text-bone/85 align-top">{ours}</td>
                <td className="p-4 text-bone/60 align-top">{theirs}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-sm text-bone/60 leading-relaxed mb-16 max-w-lg">
        This is a general comparison against the category of dating-photo-review tools, not a
        claim about any specific named product — pricing and features vary by tool and change
        over time, so evaluate any option against your own needs.
      </p>

      <div className="border-t border-hair pt-8 flex flex-col items-start gap-4">
        <p className="text-bone/75 text-sm leading-relaxed max-w-md">
          See what a full profile audit finds that a photo-only review can&apos;t.
        </p>
        <Link
          href="/signup"
          className="inline-block px-6 py-3 bg-brass text-ink font-medium rounded-lg hover:bg-brass/90 transition-colors"
        >
          Get your free audit
        </Link>
      </div>
    </main>
  );
}
