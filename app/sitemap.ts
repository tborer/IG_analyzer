import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/site';

export default function sitemap(): MetadataRoute.Sitemap {
  // /login and /signup are thin, near-duplicate content -- noindexed on the
  // page itself (see their metadata) rather than listed here.
  return [{ url: `${SITE_URL}/`, lastModified: new Date(), changeFrequency: 'weekly', priority: 1 }];
}
