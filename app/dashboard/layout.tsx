import type { Metadata } from 'next';

// Everything under /dashboard is behind auth and user-specific -- keep it
// out of search results even if robots.txt's disallow is ever ignored.
export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return children;
}
