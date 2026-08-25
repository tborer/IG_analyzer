# Follow-up backlog

Deferred or queued items from ongoing audits — not forgotten, just not in
scope for the round they came up in. Add to this file as new items get
deferred; check items off (or delete the line) once shipped.

## Legal & compliance

- [ ] **Privacy policy page.** The app collects email/password and processes
  uploaded screenshots (sent to the Anthropic API, then discarded — only the
  written audit is persisted). No privacy policy exists anywhere in the app.
  Not required without paid ads, but worth having regardless of that.
  Queued 2026-08-24.
- [ ] **Terms of service.** Usually drafted alongside the privacy policy.

## Auth & security hardening

- [ ] **Login throttling / brute-force protection** on `/api/auth/login`.
  Only `/api/audit` has a rate limit today (`lib/rate-limit.ts`).
- [ ] **Signup account-enumeration.** `/api/auth/signup` currently returns
  "An account with that email already exists" — leaks whether an email is
  registered. Flagged, no decision made on whether to accept the trade-off
  or switch to a generic error.
- [ ] **Session revocation.** Sessions are stateless JWTs with a 30-day TTL
  and no server-side denylist — logout only clears the client cookie. A
  stolen token stays valid until it naturally expires.
- [ ] **Real "forgot password" flow.** Current password-change flow
  (`/dashboard/settings`) requires knowing your current password by design
  (deliberate choice, made 2026-08-24). A true forgot-password flow needs a
  transactional email provider (e.g. Resend) — deferred until one's chosen.
- [ ] **Email verification.** Same email-provider dependency as above.

## Billing

- [ ] **Real billing (Stripe or similar).** `users.plan` (`free`/`paid`) is
  a manually-set flag today, gating the daily audit cap
  (`lib/rate-limit.ts`: 1/day free, 5/day paid). No checkout, no automatic
  upgrades.

## SEO & growth

- [ ] **Custom domain.** Currently on the default `*.vercel.app` domain.
  `lib/site.ts` is already set up to pick up `NEXT_PUBLIC_SITE_URL`
  automatically once one exists — no other code changes needed.
- [ ] **Analytics / conversion tracking.** No GA4, no Tag Manager, no signup
  conversion event. Deferred until there's a paid acquisition channel to
  measure (per user, 2026-08-24).
- [ ] **Content hub / blog.** The landing page (rebuilt 2026-08-24 for SEO)
  covers `/` well, but there's no supporting long-form content to build
  topical authority for long-tail queries (e.g. "instagram bio for dating,"
  "instagram photo tips for dating"). Worth revisiting once there's a
  content strategy.
- [ ] **Google Search Console.** Sitemap/robots exist
  (`app/sitemap.ts`/`app/robots.ts`) but haven't been submitted anywhere —
  there's no domain to verify yet.

## Code quality

- [ ] **Dead code in `components/ScoreDial.tsx`.** Unused top-level
  constants (`SIZE`, `STROKE`, `RADIUS`, `CIRC`) shadowed by per-instance
  calculations. Harmless, just cleanup.
- [ ] **Component/UI tests.** The test suite (`__tests__/`, added
  2026-08-24) covers API routes and core lib functions only — no React
  component tests yet.
- [ ] **`npm audit` / dependency hygiene.** Clean as of the Next 16 bump
  (2026-08-24) — 0 vulnerabilities. Re-check periodically.

## Product

Bio content-strategy research (started 2026-08-24, analyzing external
dating-bio advice) is fully shipped as of 2026-08-25:

- Fixed bio red-flag checklist (quotes, height/age/zodiac, unverifiable
  titles, availability language, etc.), display-name audit (real name vs.
  handle-repeat/nickname), and topActions explicitly prioritizing photo
  fixes over bio wordsmithing when the photo set is the bigger gap.
- Bio archetype framework (`BIO_ARCHETYPES`, classifying against
  Professional/Entrepreneur/Traveler/Creative/Minimal formulas and
  rewriting toward the closest fit), the profile-picture/avatar split into
  its own scored sub-check, and a bio link quality check.
- Deterministic emoji-density check (`lib/emoji.ts`) — the model
  transcribes the bio verbatim into an internal-only field, and a pure,
  unit-tested, grapheme-cluster-based function computes a
  clean/moderate/heavy verdict in code, not left to the model's judgment.
- Bio-staleness nudge (`lib/bio-staleness.ts`) — `audits.transcribed_bio`
  now persists the transcribed bio (not shown in the UI) specifically so
  each new audit can compare against the last few and flag an unchanged
  bio ("a dynamic bio signals an active life; a static one signals
  nothing's happening").

No further items queued under Product — add new ones here as they come up.
