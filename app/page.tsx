import Link from 'next/link';
import ScoreDial from '@/components/ScoreDial';

export default function LandingPage() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-16 sm:py-24">
      <header className="flex items-center justify-between mb-20">
        <span className="font-display text-lg tracking-tight">Dossier</span>
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
          <p className="eyebrow text-brass mb-4">Profile audit</p>
          <h1 className="font-display text-4xl sm:text-5xl leading-[1.1] mb-6">
            An honest read on the photos you're about to post.
          </h1>
          <p className="text-bone/75 text-lg leading-relaxed mb-8 max-w-lg">
            Upload your candidate photos and bio. Get a specific, photo-by-photo
            breakdown — what's working, what isn't, which shot should lead, and why —
            instead of a friend saying "yeah looks good."
          </p>
          <Link
            href="/signup"
            className="inline-block px-6 py-3 bg-brass text-ink font-medium rounded-lg hover:bg-brass/90 transition-colors"
          >
            Run your first audit
          </Link>
        </div>
        <div className="shrink-0 flex flex-col items-center gap-2 border border-hair rounded-lg bg-inkraised p-8">
          <ScoreDial score={82} size={120} />
          <p className="eyebrow text-mist mt-2">Example score</p>
        </div>
      </section>

      <section className="grid sm:grid-cols-3 gap-8 mb-24">
        {[
          {
            n: '01',
            title: 'Per-photo scoring',
            body: 'Lighting, composition, background, and expression, graded individually — not a single vague number.',
          },
          {
            n: '02',
            title: 'Lead photo, ranked set',
            body: 'A recommended order for your whole set, not just a pass/fail on one shot.',
          },
          {
            n: '03',
            title: 'Bio, reviewed too',
            body: 'Clarity and authenticity feedback, plus a rewritten version you can actually use.',
          },
        ].map((item) => (
          <div key={item.n}>
            <p className="font-mono text-brass mb-2">{item.n}</p>
            <h3 className="font-display text-lg mb-2">{item.title}</h3>
            <p className="text-sm text-bone/70 leading-relaxed">{item.body}</p>
          </div>
        ))}
      </section>

      <footer className="border-t border-hair pt-8 text-sm text-mist">
        Feedback is generated to be specific and actionable — grounded in photography and
        presentation fundamentals, not manipulation tactics.
      </footer>
    </main>
  );
}
