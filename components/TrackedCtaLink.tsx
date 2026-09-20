'use client';

import Link from 'next/link';
import { trackEvent } from '@/lib/analytics';

// Wraps next/link with a click-tracking side effect. Exists because
// Server Component pages (e.g. the landing page) can't pass an inline
// onClick handler down to next/link directly -- event handlers aren't
// serializable across the server/client boundary.
export default function TrackedCtaLink({
  href,
  event,
  eventProps,
  className,
  children,
}: {
  href: string;
  event: string;
  eventProps?: Record<string, unknown>;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Link href={href} className={className} onClick={() => trackEvent(event, eventProps)}>
      {children}
    </Link>
  );
}
