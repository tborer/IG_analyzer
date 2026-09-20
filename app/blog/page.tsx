import Link from 'next/link';
import { Metadata } from 'next';
import { SITE_NAME } from '@/lib/site';
import { getAllBlogPosts } from '@/lib/blog';

export const metadata: Metadata = {
  title: 'Blog',
  description: `Dating-profile strategy, Instagram photo and bio breakdowns, and the thinking behind ${SITE_NAME}'s audit criteria.`,
  alternates: { canonical: '/blog' },
};

export default function BlogIndexPage() {
  const posts = getAllBlogPosts();

  return (
    <main className="max-w-3xl mx-auto px-6 py-16 sm:py-24">
      <header className="flex items-center justify-between mb-16">
        <Link href="/" className="font-display text-lg tracking-tight">
          {SITE_NAME}
        </Link>
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

      <p className="eyebrow text-brass mb-4">The blog</p>
      <h1 className="font-display text-4xl leading-[1.1] mb-12">
        Dating-profile strategy, grounded in what actually gets scored.
      </h1>

      <div className="space-y-10 divide-y divide-hair">
        {posts.map((post) => (
          <article key={post.slug} className="pt-10 first:pt-0">
            <p className="eyebrow text-mist mb-2">
              {new Date(post.publishedAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}{' '}
              · {post.readingTime}
            </p>
            <h2 className="font-display text-2xl mb-2">
              <Link href={`/blog/${post.slug}`} className="hover:text-brass transition-colors">
                {post.title}
              </Link>
            </h2>
            <p className="text-sm text-bone/70 leading-relaxed mb-3">{post.description}</p>
            <Link
              href={`/blog/${post.slug}`}
              className="eyebrow text-brass hover:text-brass/80 transition-colors"
            >
              Read the article →
            </Link>
          </article>
        ))}
      </div>
    </main>
  );
}
