// Single source of truth for the site's public URL and brand name, used by
// layout metadata, robots.ts, sitemap.ts, and structured data. Works with no
// custom domain: NEXT_PUBLIC_SITE_URL overrides once you have one, otherwise
// it resolves to Vercel's own production/preview URL automatically.
export const SITE_NAME = 'Caliber';

export const SITE_URL = (() => {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL;
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  }
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return 'http://localhost:3000';
})();
