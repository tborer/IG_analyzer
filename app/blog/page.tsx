import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dating Profile Tips & Blog',
  description: 'Expert dating profile advice for Instagram, dating apps, and online presence optimization.',
};

export default function BlogIndex() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-16 sm:py-24">
      <header className="mb-8">
        <h1 className="font-display text-4xl mb-2">Dating Profile Tips</h1>
        <p className="text-bone/60">Expert advice for better dating profiles and more matches.</p>
      </header>

      <section className="grid gap-8 mb-12">
        {/* Placeholder blog posts */}
        <article className="border border-hair rounded-lg p-6 hover:border-brass/50 transition-colors">
          <h2 className="font-display text-xl mb-3">
            <a href="/blog/instagram-bio-for-dating" className="hover:text-brass">
              How to Write an Instagram Bio That Gets More Matches
            </a>
          </h2>
          <p className="text-sm text-bone/70 leading-relaxed mb-4">
            Your bio is the first impression people have of you. Learn what makes a dating profile bio attractive and avoids red flags.
          </p>
          <a href="/blog/instagram-bio-for-dating" className="inline-block text-brass hover:underline">
            Read more →
          </a>
        </article>

        {/* Future blog posts - will be populated */}
        <article className="border border-hair rounded-lg p-6 bg-brass/5">
          <h2 className="font-display text-xl mb-3 opacity-50">
            Coming soon: More dating profile tips
          </h2>
          <p className="text-sm text-bone/70 leading-relaxed">
            We&apos;re building a content hub with expert dating advice. Check back later!
          </p>
        </article>
      </section>

      <footer className="pt-8 border-t border-hair mt-12">
        <Link href="/" className="inline-block px-6 py-3 bg-brass text-ink font-medium rounded-lg hover:bg-brass/90 transition-colors mb-4">
          Back to Home
        </Link>
      </footer>
    </main>
  );
}
