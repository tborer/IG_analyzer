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

Bio content-strategy research (2026-08-24, analyzing external dating-bio
advice) shipped its high-value/low-effort findings the same day:
`lib/anthropic.ts` now checks a fixed bio red-flag checklist (quotes,
height/age/zodiac, unverifiable titles, availability language, etc.),
audits the display name separately from the bio text (real name vs.
handle-repeat/nickname), and explicitly prioritizes photo fixes over bio
wordsmithing in `topActions` when the photo set is the bigger gap.

Batch 2/3 (2026-08-25) also shipped: **deterministic emoji-density check**
(`lib/emoji.ts`) — the model transcribes the bio verbatim into an
internal-only field, and a pure, unit-tested function (grapheme-cluster
based, so ZWJ/skin-tone sequences count correctly as one emoji) computes a
clean/moderate/heavy verdict in code rather than leaving "too many emojis"
to the model's judgment.

Batch 1/3 (2026-08-25) shipped: bio archetype framework
(`BIO_ARCHETYPES`, classifying against Professional/Entrepreneur/Traveler/
Creative/Minimal formulas and rewriting toward the closest fit), the
profile-picture/avatar split into its own scored sub-check (own
identifiability flag and named failure patterns), and a bio link quality
check (status-signaling link vs. noise).

Remaining finding from that research, not yet built:

- [ ] **Bio-staleness nudge**, using audit history we already store —
  detect an unchanged bio across the last few audits and flag it ("a
  dynamic bio signals an active life; a static one signals nothing's
  happening"). This is batch 3/3, still queued.
