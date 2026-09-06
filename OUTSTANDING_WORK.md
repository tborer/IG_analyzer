# Outstanding work — Caliber

Last reviewed: 2026-09-06.

This is the authoritative backlog going forward. It supersedes `FOLLOWUP.md`
(kept for history/context, but new items should land here). Items are grouped
by workstream and ordered roughly by priority within each group.

## What the app is, today

Caliber audits a user's *existing, live* Instagram profile for dating
effectiveness. A signed-up user uploads bio text + profile screenshots,
Claude's vision model scores each photo against dating-profile archetypes,
checks bio quality (red flags, archetype fit, staleness, emoji density,
link quality), and returns a coverage report + prioritized next actions.
Stack: Next.js 16 (App Router/TS) on Vercel, Turso (libSQL) for storage,
custom bcrypt+JWT auth (no third-party auth service), Anthropic API for
analysis. Photos are never persisted — only the generated JSON result is.

Shipped so far (see `git log` and `FOLLOWUP.md` for detail): core audit
pipeline, auth (signup/login/logout/change-password), per-plan daily rate
limiting, audit history, SEO-oriented landing page + JSON-LD + OG image +
sitemap/robots, a starter Vitest suite for API routes and lib functions,
and a fairly deep bio-analysis feature set (archetypes, red-flag checklist,
staleness nudge, emoji density, link check, avatar split).

Explicitly **not** built yet: several auth/legal hardening items already
flagged in `FOLLOWUP.md`, search-engine visibility beyond on-page basics (no
verified property, no indexed content depth, no analytics), a test suite
that exercises the app the way a user or CI pipeline would (integration/E2E,
component tests), and real billing (plan is a manually-set DB flag). This
document leads with the carried-over follow-up items, then search, then
testing, and ends with Stripe billing.

---

## 1. Carried-over hardening (from FOLLOWUP.md, still open)

Kept here rather than duplicated — see `FOLLOWUP.md` for the original
framing. These are the nearest-term items: mostly small, self-contained,
and don't depend on anything else in this document. The legal items
(privacy policy, ToS) matter on their own regardless of billing, but note
they become hard blockers later once Stripe billing (§4) goes live.

- [ ] **Privacy policy + Terms of Service.** The app collects email/password
  and processes uploaded screenshots (sent to the Anthropic API, then
  discarded — only the written audit is persisted). No privacy policy or
  ToS exists anywhere in the app today. Must disclose what's collected,
  that screenshots go to Anthropic's API and aren't stored, and (once §4
  ships) that Stripe processes billing data. Not required without paid ads
  today, but becomes non-optional before enabling real checkout.
- [ ] **Login throttling / brute-force protection** on `/api/auth/login` —
  only `/api/audit` is rate-limited today (`lib/rate-limit.ts`).
- [ ] **Signup account-enumeration.** `/api/auth/signup` currently returns
  "An account with that email already exists" — leaks whether an email is
  registered. Needs an explicit decision: accept the trade-off, or switch
  to a generic error / email-based confirmation.
- [ ] **Session revocation.** Sessions are stateless JWTs with a 30-day TTL
  and no server-side denylist — logout only clears the client cookie. A
  stolen token stays valid until it naturally expires.
- [ ] **Real "forgot password" flow** + **email verification.** Both need a
  transactional email provider (e.g. Resend, Postmark) — deferred until
  one's chosen. Worth deciding on a provider now: Stripe billing emails
  (receipts, payment-failed notices, see §4) will need the same
  infrastructure, so solve it once rather than twice.
- [ ] **Dead code in `components/ScoreDial.tsx`.** Unused top-level
  constants (`SIZE`, `STROKE`, `RADIUS`, `CIRC`) shadowed by per-instance
  calculations. Harmless, just cleanup — worth fixing once automated tests
  (§3) make this kind of regression visible going forward.
- [ ] **`npm audit` / dependency hygiene.** Clean as of the Next 16 bump —
  re-check periodically; once CI exists (§3) this should become a CI step
  (`npm audit --audit-level=high`) rather than a manual habit.

## 2. Search visibility (SEO/SEM)

The on-page fundamentals are already good (JSON-LD, OG image, sitemap,
robots, canonical URL resolution). What's missing is everything that gets
the site actually crawled, indexed, ranked, and — if pursued — found via
paid search. None of this works without a stable custom domain first.

- [ ] **Custom domain.** Buy/point a domain at the Vercel deployment and set
  `NEXT_PUBLIC_SITE_URL` accordingly. Blocks Search Console verification,
  backlink building, and looks more legitimate for a paid product. (Carried
  over from `FOLLOWUP.md`.)
- [ ] **Google Search Console + Bing Webmaster Tools.** Verify the domain,
  submit `sitemap.xml`, monitor coverage/index errors and Core Web Vitals.
  Zero cost, should happen the day the custom domain is live.
- [ ] **Structured data validation.** Run the current `WebApplication` +
  `FAQPage` JSON-LD through Google's Rich Results Test once on a real
  domain (some structured-data validators reject `localhost`/preview URLs);
  fix anything flagged before relying on rich snippets.
- [ ] **Content hub / blog for long-tail queries.** The landing page covers
  `/` but there's no supporting content targeting queries like "instagram
  bio for dating," "instagram photo tips for dating apps," "how to make
  your instagram dating-profile ready." Needs: a `/blog` or `/guides`
  route, a handful of genuinely useful launch articles (not thin SEO
  filler), and those URLs added to `app/sitemap.ts`. This is the single
  biggest lever for organic (non-paid) discovery given the product has no
  existing brand or backlinks.
- [ ] **Internal linking.** Once a content hub exists, link from articles
  back to `/` and `/signup` with descriptive anchor text; link between
  related articles.
- [ ] **Meta descriptions & titles per route.** Confirm `/login`, `/signup`,
  and any new content routes have distinct, accurate titles/descriptions
  (avoid Next's default title fallback bleeding through).
- [ ] **Performance/Core Web Vitals pass.** Run Lighthouse/PageSpeed
  Insights against the production URL once deployed to a stable domain;
  Next 16 + `next/og` should already be solid, but verify (especially
  image loading in `UploadForm`/dashboard, which handle user photos).
- [ ] **Analytics + conversion tracking.** No GA4/Plausible/etc. today.
  Needed before any SEM spend is justified (can't optimize paid acquisition
  you can't measure), and useful for organic funnel visibility too:
  landing → signup → first audit → upgrade. Pick a privacy-respecting
  option (e.g. Plausible or GA4 with consent handling) given the app
  already collects user email/photos.
- [ ] **SEM (paid search) readiness** — only after analytics exists:
  conversion tracking wired to Google Ads/Meta Ads if paid acquisition is
  pursued, a dedicated landing variant for ad traffic (optional), and a
  documented CAC/LTV rationale before spending anything. Explicitly listed
  as *later* — don't build ad infrastructure before organic + billing are
  solid, since paid traffic to a site with no billing or thin content
  wastes spend.
- [ ] **Backlinks / launch distribution.** Not code work, but worth tracking
  here: Product Hunt / relevant subreddit / dating-advice communities launch
  once the product has real billing and can sustain traffic.

## 3. Automated testing

Current coverage (`__tests__/`, Vitest): API route handlers (`audit`,
`auth-routes`, `change-password`) and core lib functions (`auth`,
`bio-staleness`, `emoji`, `rate-limit`), all with DB/Anthropic calls mocked.
That's solid unit/smoke coverage for backend logic but nothing exercises
the app end-to-end, nothing renders a React component, and nothing runs in
CI automatically.

- [ ] **Wire tests into CI.** No `.github/workflows/*.yml` exists today —
  `npm test` only runs when someone remembers to run it locally. Add a
  GitHub Actions workflow running `npm ci`, `npm run lint`, `npm test` (and
  `npm run build` as a compile-correctness check) on every PR and push to
  main. This is the single highest-value testing item: untested code paths
  are much less risky than *tested* code paths nobody runs.
- [ ] **Component tests.** Add `@testing-library/react` (+ `jsdom` or
  Vitest's browser mode) and cover at least: `UploadForm` (file selection,
  validation, submit states), `AuditResults`/`ScoreDial`/`VerdictBadge`
  (render given a sample audit result, including edge cases like a 0 score
  or missing coverage data), `AuthForm` (validation errors), and
  `ChangePasswordForm`. Carried over from `FOLLOWUP.md`.
- [ ] **End-to-end tests.** Add Playwright covering the golden paths: signup
  → login → upload/audit → view result → logout; history page lists a past
  audit; settings page changes a password; rate-limit UX when the daily cap
  is hit. Mock or stub the Anthropic vision call at the network layer so
  E2E runs don't require live API credentials or burn real usage — either
  via a test-mode flag in `lib/anthropic.ts` or route-level interception in
  Playwright.
- [ ] **Auth security regression tests.** Once login throttling and session
  revocation exist (§1), add explicit tests: N failed logins lock
  out/backoff correctly; a revoked session's JWT is rejected even though it
  hasn't expired.
- [ ] **Coverage reporting.** Turn on `vitest --coverage` in CI (fails or at
  least reports below some agreed threshold) so gaps are visible instead of
  assumed.
- [ ] **Stripe integration tests** (once billing ships, see §4): test-mode
  checkout session creation, webhook signature verification, and webhook
  handler idempotency (replaying the same event twice shouldn't double
  apply an upgrade). Stripe's official test fixtures/CLI (`stripe trigger`)
  are the right tool here rather than hand-rolled fixtures.

## 4. Stripe billing — real payments and plan access

Today `users.plan` (`free`/`paid`) is hand-edited in the DB. There is no
checkout, no customer record, no webhook handling, and no way for a user to
upgrade, downgrade, or cancel themselves. This is the product's core
monetization unlock, sequenced last here because it depends on the legal
groundwork (§1) and benefits from having CI/tests (§3) in place before
introducing a payments surface.

- [ ] **Schema.** Add `stripe_customer_id`, `stripe_subscription_id`,
  `subscription_status` (e.g. `active`/`past_due`/`canceled`/`incomplete`),
  and `current_period_end` to `users` (migration in `schema.sql`, applied
  via `scripts/init-db.mjs`'s "add what's missing" pattern). Keep `plan`
  derived from `subscription_status` rather than hand-set once this ships.
- [ ] **Product/price setup.** Create the paid plan as a Stripe Product +
  recurring Price (monthly, and annual if desired) in the Stripe Dashboard
  (test mode first). Record the price ID(s) in env vars, not hardcoded.
- [ ] **Checkout flow.** `/api/billing/checkout` (or similar) creates a
  Stripe Checkout Session for the signed-in user (attach `client_reference_id`
  or metadata = internal user id), redirects to Stripe-hosted checkout, and
  returns to a `/dashboard?upgraded=1`-style success URL and a cancel URL.
- [ ] **Customer portal.** `/api/billing/portal` creates a Stripe Billing
  Portal session so users can update payment method, view invoices, or
  cancel — without building that UI ourselves.
- [ ] **Webhooks.** `/api/webhooks/stripe` verifying the signature
  (`stripe.webhooks.constructEvent` with `STRIPE_WEBHOOK_SECRET`), handling
  at minimum: `checkout.session.completed` (link `stripe_customer_id` to the
  user, set plan to paid), `customer.subscription.updated` /
  `customer.subscription.deleted` (keep `subscription_status`/`plan` in
  sync — this is the source of truth, not the checkout redirect), and
  `invoice.payment_failed` (flag `past_due`, optionally email the user once
  a transactional provider exists — see §1). Must be idempotent (Stripe
  retries webhooks; dedupe on event id or make handlers safe to replay).
  Route needs the raw request body for signature verification — don't let
  Next.js parse it as JSON first.
- [ ] **Gate on `subscription_status`, not just `plan`.** `lib/rate-limit.ts`
  currently reads `plan` directly; once billing exists, a `past_due` or
  `canceled` subscription should demote effective access even if `plan` is
  stale, so this needs a clear single function (e.g. `getEffectivePlan`)
  that both the rate limiter and any future paywalled UI call.
  Design decision needed: grace period on `past_due` (e.g. still `paid` for
  N days) vs. immediate demotion — pick one and document it here.
- [ ] **Pricing/upgrade UI.** A pricing section (landing page and/or
  `/dashboard/settings`) with an "Upgrade" button hitting the checkout
  route, and an "Manage billing" button hitting the portal route for
  existing subscribers. Show current plan and (once subscribed) renewal
  date / status on `/dashboard/settings`.
- [ ] **Env vars.** `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`,
  `STRIPE_PRICE_ID_*` — add to `.env.example` and Vercel project settings.
  Use Stripe **test mode** keys everywhere until launch; document the
  test→live key swap as a deploy step.
- [ ] **Local webhook testing.** Document `stripe listen --forward-to
  localhost:3000/api/webhooks/stripe` in the README so webhook handling can
  be developed/tested without deploying.
- [ ] **Tax/compliance basics.** Decide whether to enable Stripe Tax (or at
  minimum collect billing address) before charging real customers; the
  privacy policy/ToS from §1 must exist before taking payment.
- [ ] **Failure/edge-case UX.** What a free user sees when they hit the
  daily cap should link to upgrade; what a `past_due` paid user sees should
  prompt fixing payment via the portal link, not a generic rate-limit error.

---

## Suggested sequencing

1. **Carried-over hardening (§1)** first — small, self-contained, and the
   legal items (privacy policy, ToS) need to exist before billing anyway.
2. **SEO foundations (§2: custom domain, Search Console, content hub)** —
   can run in parallel with §1; content hub is the long lead-time item,
   worth starting early.
3. **CI + component/E2E tests (§3)** — put a safety net in place before
   introducing a payments surface in §4.
4. **Stripe billing (§4)** — the product's core unlock, sequenced last so
   it lands on top of the legal groundwork and test coverage above.
