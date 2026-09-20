import { Metadata } from 'next';

interface BlogPostProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  // Static generation for known posts - add more as content grows
  return [
    { slug: 'instagram-bio-for-dating' },
    { slug: 'instagram-photo-tips-single-men' },
    { slug: 'instagram-grid-strategy-matching' },
    { slug: 'dating-profile-audit-checklist' },
  ];
}

export async function generateMetadata({ params }: BlogPostProps): Promise<Metadata> {
  const { slug } = await params;
  
  switch (slug) {
    case 'instagram-bio-for-dating':
      return {
        title: 'Instagram Bio for Dating - Expert Tips',
        description: 'Learn how to write an Instagram bio that attracts better matches. Avoid red flags and showcase your personality.',
      };
    default:
      return {
        title: `${slug} - Caliber`,
        description: 'Expert dating profile advice.',
      };
  }
}

export default function BlogPost() {
  const { slug } = await (await import('next/navigation')).useRouter().prepareRouteProps?.()?.params || { slug: '' };
  
  return (
    <main className="max-w-3xl mx-auto px-6 py-16 sm:py-24">
      <article>
        <header className="mb-8">
          <h1 className="font-display text-4xl mb-2">{slug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</h1>
          <p className="text-sm text-bone/60">
            Published: {new Date().toLocaleDateString()}
          </p>
        </header>

        <div className="prose prose-invert max-w-none mb-8">
          <p className="text-bone/70 leading-relaxed">
            Blog post content goes here. This is a template for individual blog posts targeting long-tail dating profile keywords.
          </p>
          
          {/* SEO internal linking */}
          <nav className="mt-6 pt-6 border-t border-hair">
            <h2 className="font-display text-lg mb-4">Related Articles</h2>
            <ul className="space-y-2 text-sm text-bone/70">
              <li><a href="/" className="hover:text-brass underline decoration-dotted">Back to Home</a></li>
              <li><a href="/signup" className="inline-block mt-3 px-6 py-2 bg-brass text-ink font-medium rounded-lg hover:bg-brass/90 transition-colors">Try Caliber Free →</a></li>
            </ul>
          </nav>
        </div>

        <footer className="pt-8 border-t border-hair mt-12">
          <Link href="/" className="inline-block px-6 py-3 bg-brass text-ink font-medium rounded-lg hover:bg-brass/90 transition-colors mb-4">
            Back to Home
          </Link>
        </footer>
      </article>
    </main>
  );
}
