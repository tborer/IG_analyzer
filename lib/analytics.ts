import { SITE_URL } from './site';

// Set once a Plausible site is registered; unset in local dev/tests/build,
// where tracking should silently no-op rather than fail the request.
const PLAUSIBLE_DOMAIN = process.env.PLAUSIBLE_DOMAIN;

declare global {
  interface Window {
    plausible?: (name: string, opts?: { props?: Record<string, unknown> }) => void;
  }
}

/**
 * Fires a Plausible custom event. Works from both client components (via
 * the `window.plausible` queue the official script tag installs) and
 * server code (Route Handlers, via Plausible's HTTP Events API directly --
 * more reliable than a client-fired event for critical conversions like
 * signup_completed, since it isn't affected by ad blockers). Always
 * best-effort: analytics must never fail the request it's attached to.
 */
export function trackEvent(name: string, props?: Record<string, unknown>): void {
  if (!PLAUSIBLE_DOMAIN) return;

  if (typeof window !== 'undefined') {
    window.plausible?.(name, props ? { props } : undefined);
    return;
  }

  fetch('https://plausible.io/api/event', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, domain: PLAUSIBLE_DOMAIN, url: SITE_URL, props }),
  }).catch(() => {
    // Best-effort — swallow network errors.
  });
}

export const PLAUSIBLE_SCRIPT_DOMAIN = PLAUSIBLE_DOMAIN;
