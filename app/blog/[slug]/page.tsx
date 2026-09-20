import Link from 'next/link';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { SITE_NAME, SITE_URL } from '@/lib/site';
import { getAllBlogPosts, getBlogPostBySlug, type BlogBlock } from '@/lib/blog';

type PageParams = Promise<{ slug: string }>;

export function generateStaticParams() {
  return getAllBlogPosts().map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: { params: PageParams }): Promise<Metadata> {
  const { slug } = await params;
  const post = getBlogPostBySlug(slug);
  if (!post) return {};

  return {
    title: post.title,
    description: post.description,
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: {
      title: post.title,
      description: post.description,
      url: `/blog/${post.slug}`,
      type: 'article',
      publishedTime: post.publishedAt,
    },
  };
}

function renderBlock(block: BlogBlock, i: number) {
  switch (block.type) {
    case 'h2':
      return (
        <h2 key={i} className="font-display text-xl mt-10 mb-3">
          {block.text}
        </h2>
      );
    case 'ul':
      return (
        <ul key={i} className="list-disc pl-5 space-y-1.5 text-sm text-bone/70 leading-relaxed">
          {block.items.map((item, j) => (
            <li key={j}>{item}</li>
          ))}
        </ul>
      );
    case 'quote':
      return (
        <blockquote
          key={i}
          className="border-l-2 border-brass/50 pl-4 my-6 text-bone/85 font-display italic text-lg"
        >
          {block.text}
        </blockquote>
      );
    case 'p':
    default:
      return (
        <p key={i} className="text-sm text-bone/70 leading-relaxed mb-4">
          {block.text}
        </p>
      );
  }
}

export default async function BlogPostPage({ params }: { params: PageParams }) {
  const { slug } = await params;
  const post = getBlogPostBySlug(slug);
  if (!post) notFound();

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.description,
    datePublished: post.publishedAt,
    author: { '@type': 'Organization', name: SITE_NAME },
    publisher: { '@type': 'Organization', name: SITE_NAME },
    mainEntityOfPage: `${SITE_URL}/blog/${post.slug}`,
  };

  return (
    <main className="max-w-3xl mx-auto px-6 py-16 sm:py-24">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

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

      <article>
        <p className="eyebrow text-mist mb-3">
          {new Date(post.publishedAt).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}{' '}
          · {post.readingTime}
        </p>
        <h1 className="font-display text-3xl sm:text-4xl leading-[1.1] mb-8">{post.title}</h1>
        <div>{post.body.map(renderBlock)}</div>
      </article>

      <div className="mt-16 border-t border-hair pt-8 flex flex-col items-start gap-4">
        <p className="text-bone/75 text-sm leading-relaxed max-w-md">
          Get a specific, photo-by-photo audit of your own Instagram — scored against exactly
          the criteria in this article.
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
