'use client';

import { useEffect } from 'react';
import { trackEvent } from '@/lib/analytics';

// Fires a Plausible pageview-style custom event once on mount. Kept as its
// own tiny client component so pages that are otherwise Server Components
// (e.g. the landing page) don't need to become client components just to
// track a view.
export default function PageViewTracker({ event }: { event: string }) {
  useEffect(() => {
    trackEvent(event);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
