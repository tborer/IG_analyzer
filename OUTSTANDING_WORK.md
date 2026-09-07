# Outstanding work — Caliber

Last reviewed: 2026-09-07.

This is the authoritative backlog going forward. It supersedes `FOLLOWUP.md`
(kept for history/context, but new items should land here). Sections are
ordered: (1) carried-over hardening, (2) search visibility, (3) automated
testing, (4) Stripe billing. Every item below is written as a feature spec —
problem, requirements, design, and acceptance criteria — rather than a bare
checklist line, so any of them can be picked up and implemented without
needing a separate design conversation first. Concrete facts (file paths,
function names, current behavior) are taken directly from the current
codebase as of this review; treat the *design* portions as the recommended
approach, open to revision during implementation.

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
component tests), and real billing (plan is a manually-set DB flag).

---

## 1. Carried-over hardening (from FOLLOWUP.md, still open)

Nearest-term items: mostly small, self-contained, and don't depend on
anything else in this document. The legal items (privacy policy, ToS)
matter on their own regardless of billing, but become hard blockers later
once Stripe billing (§4) goes live.

### 1.1 Privacy policy + Terms of Service

**Problem.** The app collects email + password hash and processes uploaded
screenshots (sent to the Anthropic API, then discarded — only the generated
JSON audit is persisted, per `schema.sql`'s `audits` table). No privacy
policy or ToS page exists anywhere in the app. Not legally required
without paid ads or billing today, but becomes non-optional before real
checkout (§4) goes live, and is good practice regardless.

**Requirements.**
- New routes `/privacy` and `/terms`, static server-rendered pages (App
  Router `app/privacy/page.tsx`, `app/terms/page.tsx`), linked from the
  landing page footer and from `/signup` (a "By signing up you agree to our
  Terms and Privacy Policy" line, standard practice and also protects the
  business once payments exist).
- Privacy policy must disclose, in plain language: what's collected
  (email, password hash, uploaded bio text/screenshots), that screenshots
  are transmitted to Anthropic's API for analysis and are **not** stored
  (call out the `audits` table only stores the model's JSON output +
  `transcribed_bio`, not images), retention (indefinite until account
  deletion — note there's no self-serve account deletion yet, see 1.6-adjacent
  gap below), and — once §4 ships — that Stripe processes billing/payment
  data as a sub-processor.
- ToS should cover: acceptable use, no guarantee of dating outcomes
  (liability disclaimer — this is a "critique tool," not a guarantee),
  account termination rights, and (once §4 ships) subscription/refund
  terms.
- Both pages should be added to `app/sitemap.ts` as indexable (unlike
  `/login`/`/signup`, which are `noindex`) — legal pages are fine to index
  and sometimes helpful for trust signals.
- No dynamic content needed initially — static JSX/MDX is fine. Revisit as
  a CMS-backed page only if these need frequent updates.

**Out of scope.** Cookie-consent banners (the app doesn't yet set
non-essential cookies — only the session cookie, which is strictly
necessary and doesn't require consent under GDPR/ePrivacy). Revisit if
analytics (§2.8) or ad pixels (§2.9) are added, since those may need
consent gating.

**Acceptance criteria.**
- [ ] `/privacy` and `/terms` render, are linked from footer + signup, and
  are listed in `sitemap.xml`.
- [ ] Privacy policy accurately reflects current data handling (verified
  against `schema.sql`, `lib/anthropic.ts`, and the audit route).
- [ ] Legal review (or at minimum a human read-through, not just AI-drafted
  boilerplate) before going live with real payments.

### 1.2 Login throttling / brute-force protection

**Problem.** `/api/audit` enforces a per-user daily cap (`lib/rate-limit.ts`),
but `/api/auth/login` (`app/api/auth/login/route.ts`) has no rate limiting
at all — unlimited password guesses per email or per IP.

**Requirements.**
- Add a `login_attempts` table (or reuse a generic rate-limit table) keyed
  by normalized email **and** by IP, since either can be the attack vector
  (credential stuffing across many emails from one IP; distributed
  guessing against one email from many IPs).
  ```sql
  create table if not exists login_attempts (
    id text primary key,
    email text not null,
    ip text not null,
    succeeded integer not null default 0,
    created_at text not null default (datetime('now'))
  );
  create index if not exists idx_login_attempts_email on login_attempts(email, created_at);
  create index if not exists idx_login_attempts_ip on login_attempts(ip, created_at);
  ```
- Policy: lock out an email after 5 failed attempts within 15 minutes
  (return 429 with a "try again in N minutes" message, mirroring the
  existing 429 shape used by `/api/audit`'s rate limit); apply a coarser IP-based
  cap (e.g. 20 failed attempts/hour across all emails) to slow distributed
  attacks. Use exponential or fixed backoff — fixed 15-minute lockout is
  simplest and sufficient for v1.
- Record every attempt (success and failure) so the lockout window can be
  computed with a simple `count(*)` query, following the same pattern
  `getAuditsUsedToday` already uses in `lib/rate-limit.ts`.
- Extract shared logic into `lib/login-rate-limit.ts` (parallel to
  `lib/rate-limit.ts`) with `recordLoginAttempt`, `isLockedOut`.
- Get the client IP from `req.headers.get('x-forwarded-for')` (Vercel sets
  this) with a safe fallback when absent (don't crash — treat as
  ungated by IP if unavailable, since email-based lockout still applies).

**Acceptance criteria.**
- [ ] 6th consecutive failed login for the same email within 15 minutes
  returns 429, not 401.
- [ ] A successful login is not blocked by *other* accounts' failed
  attempts from the same IP unless the IP-wide cap is independently hit.
- [ ] Attempt records don't grow unbounded — either a scheduled cleanup job
  or a `created_at`-bounded query (acceptable for v1: don't over-engineer
  cleanup before it's a real storage problem).
- [ ] Unit tests (feeds into §3) covering: under-threshold attempts pass
  through, threshold+1 returns 429, lockout expires after the window.

### 1.3 Signup account-enumeration

**Problem.** `app/api/auth/signup/route.ts` returns `409` with "An account
with that email already exists" when the email is taken — this lets an
attacker enumerate registered emails by attempting signup.

**Requirements — decision needed, then implement.** Two options, pick one:
- **Option A (accept the trade-off):** Keep the explicit error but document
  the accepted risk here. Low severity for this product (no highly
  sensitive membership implication the way e.g. an affair-focused or
  political app would carry), and a generic error meaningfully hurts UX
  ("check your email" when the user typo'd — they'd have no idea why
  nothing arrived).
- **Option B (mitigate):** Return a generic success response either way
  ("If that email isn't already registered, check your inbox to finish
  signing up") and email-based confirmation — but this requires the
  transactional email provider that's already a dependency for 1.5
  (forgot-password/verification). Since that provider doesn't exist yet,
  Option B is coupled to 1.5 and should ship together with it, not before.

**Recommendation for this document:** ship **Option A now** (explicitly
accepted, documented) and revisit as part of 1.5 once email infrastructure
exists, since Option B without it would mean silently failing to notify a
genuine new signup.

**Acceptance criteria.**
- [ ] Decision recorded in this doc (done above) so it isn't re-litigated.
- [ ] If Option B is later chosen: signup response is identical for
  "email taken" vs. "email available", and the actual account-creation
  outcome is only communicated over email.

### 1.4 Session revocation

**Problem.** `lib/auth.ts`'s `createSessionToken`/`verifySessionToken` issue
stateless JWTs (30-day TTL, `SESSION_MAX_AGE_SECONDS`) with no server-side
denylist. `/api/auth/logout` (implied by `app/api/auth/logout`) can only
clear the client's cookie — a copied/stolen token stays valid for up to 30
days regardless.

**Requirements.**
- Add a `sid` (session id, `randomUUID()`) claim to the JWT payload
  alongside the existing `uid`, generated in `createSessionToken`.
- Add a `revoked_sessions` table:
  ```sql
  create table if not exists revoked_sessions (
    sid text primary key,
    revoked_at text not null default (datetime('now'))
  );
  ```
- `verifySessionToken` must check the `sid` against `revoked_sessions` and
  return `null` if present — meaning it becomes async-DB-aware (it already
  is `async`, so no signature change, but it starts needing a `query()`
  call, meaning `lib/auth.ts` takes a dependency on `lib/db.ts`; verify this
  doesn't create a circular import or break edge-runtime compatibility —
  check whether the auth check runs in Next.js middleware today, since
  Turso's `@libsql/client` may not run in the Edge runtime. If it does,
  session checks currently in middleware would need to move to
  Node-runtime route handlers, or use a lighter revocation check).
- On logout (`/api/auth/logout`), insert the current token's `sid` into
  `revoked_sessions` in addition to clearing the cookie.
- On password change (`app/api/auth/change-password`), revoke all of the
  user's other outstanding sessions as a security best practice — this
  requires tracking `sid`s per user, so either add a `user_id` column to
  `revoked_sessions` and revoke-by-listing-active-sids (harder without a
  session table), or simpler: add a `sessions_invalidated_at` timestamp
  column on `users`, stamp it on password change, and have
  `verifySessionToken` reject any token whose `iat` (issued-at) predates
  the user's `sessions_invalidated_at`. This is simpler than a full
  denylist and handles the most common case (password change / "log out
  everywhere"); keep the `sid` denylist only for single-session logout.
- Expired denylist rows can be pruned (a `revoked_at` older than the JWT
  max-age, 30 days, can never match a still-valid token) — a periodic
  cleanup or just leave it, matching the pragmatism of 1.2's attempt-log
  cleanup decision.

**Acceptance criteria.**
- [ ] Logging out invalidates that specific session's token immediately
  (a replay of the old cookie value after logout returns 401 on any
  authenticated route).
- [ ] Changing password invalidates all *other* active sessions for that
  user (single sign-out-everywhere semantics), while the session used to
  make the change stays valid.
- [ ] Verified this doesn't break if/when auth checks run in Edge
  middleware (either confirmed compatible with `@libsql/client`, or the
  check is moved to a runtime that supports it).

### 1.5 Real "forgot password" flow + email verification

**Problem.** `/dashboard/settings`'s change-password flow requires knowing
the current password by design. There's no way to recover a lost password,
and no email verification on signup (so an unowned/mistyped email can
register an account with no way to confirm it).

**Requirements.**
- **Pick a transactional email provider first** — this blocks both this
  item and (later) Stripe receipt/payment-failed emails (§4), so decide
  once. Resend is a reasonable default for a Next.js/Vercel app (first-class
  SDK, generous free tier); Postmark is the alternative if deliverability
  reputation matters more out of the gate. Record the choice here once made.
- **Schema:** `password_reset_tokens` table — `token` (random, hashed at
  rest the same way passwords are — store a SHA-256 hash of the token, not
  the raw token, so a DB leak doesn't hand out live reset links),
  `user_id`, `expires_at` (short TTL, e.g. 1 hour), `used_at` (nullable,
  set on redemption to prevent replay).
- **Endpoints:**
  - `POST /api/auth/forgot-password` — takes `email`, always returns a
    generic 200 ("If that email is registered, a reset link is on its
    way") regardless of whether the account exists (no enumeration leak
    here, unlike 1.3's open question — this one has no UX cost to being
    generic, since there's no immediate action the user needs confirmed).
    Creates a reset token + emails the link if the account exists.
  - `GET/POST /api/auth/reset-password` — takes `token` + new `password`,
    validates token hash + expiry + unused, updates `password_hash`,
    marks token used, and (per 1.4) invalidates other active sessions.
  - `POST /api/auth/verify-email` (+ a `email_verified_at` column on
    `users`, nullable) — same token pattern, sent at signup. Decide whether
    unverified accounts are fully blocked or just soft-nudged (recommend:
    soft nudge for v1 — don't block usage on it, since the audit flow adds
    friction the product can't afford to lose signups over yet; revisit
    once transactional email is proven reliable).
- **UI:** a "Forgot password?" link on `/login` to a new `/forgot-password`
  page (email input) and `/reset-password?token=...` page (new password
  input); a "resend verification email" affordance somewhere on
  `/dashboard` if unverified.

**Acceptance criteria.**
- [ ] A user who forgets their password can regain account access without
  contacting support, end to end, via email.
- [ ] Reset tokens are single-use, expire, and are stored hashed.
- [ ] Reset does not leak account existence via response-time or
  response-content differences.
- [ ] Email-sending failures (provider outage) degrade to a clear error,
  not a silent black hole — the user should know to retry later.

### 1.6 Dead code in `components/ScoreDial.tsx`

**Problem.** Unused top-level constants (`SIZE`, `STROKE`, `RADIUS`,
`CIRC`) are shadowed by per-instance calculations inside the component.
Harmless but confusing to a future reader.

**Requirements.** Remove the unused top-level constants; confirm the
component still renders identically (covered once component tests exist,
§3.2) and that `next lint` (or a stricter `no-unused-vars` rule) would have
caught this — consider enabling that lint rule at error severity if it
isn't already, to prevent recurrence.

**Acceptance criteria.**
- [ ] Constants removed, component behavior unchanged (visual diff / test
  snapshot identical).
- [ ] `no-unused-vars` (or equivalent) enabled and passing in CI (§3.1).

### 1.7 `npm audit` / dependency hygiene

**Problem.** Clean as of the Next 16 bump, but nothing enforces it stays
that way — it's a manual, easily-forgotten habit today.

**Requirements.** Add `npm audit --audit-level=high` as a step in the CI
workflow from §3.1 (not a standalone cron — piggyback on existing CI runs
so it's visible on every PR rather than a separate silent job). Decide
policy on failure: block the PR, or just surface a warning — recommend
warning-only initially (a high-severity advisory in a transitive dep
shouldn't block unrelated feature work), revisited to blocking once the
team has bandwidth to triage promptly.

**Acceptance criteria.**
- [ ] `npm audit --audit-level=high` runs in CI on every PR.
- [ ] Failure mode (warn vs. block) is an explicit, documented choice, not
  a default nobody decided.

## 2. Search visibility (SEO/SEM)

The on-page fundamentals are already good (JSON-LD, OG image, sitemap,
robots, canonical URL resolution via `lib/site.ts`). What's missing is
everything that gets the site actually crawled, indexed, ranked, and — if
pursued — found via paid search. None of this works without a stable
custom domain first.

### 2.1 Custom domain

**Problem.** Currently on the default `*.vercel.app` domain. `lib/site.ts`
already resolves `NEXT_PUBLIC_SITE_URL` first, falling back to Vercel's own
URL — so this is a config/purchase task, not a code change.

**Requirements.**
- Register a domain (brand-matching `Caliber`-adjacent name, checking for
  trademark conflicts given "Caliber" is a common word/brand across
  industries — worth a quick trademark-conflict sanity check before
  committing budget to a domain + any paid marketing under this name).
- Add the domain in Vercel project settings, configure DNS (A/CNAME per
  Vercel's instructions), set `NEXT_PUBLIC_SITE_URL` in Vercel env vars to
  the final `https://` URL.
- Verify `app/robots.ts`, `app/sitemap.ts`, and the OG image
  (`app/opengraph-image.tsx`) all resolve to the new domain post-deploy
  (they read `SITE_URL` from `lib/site.ts`, so this should be automatic —
  confirm rather than assume).

**Acceptance criteria.**
- [ ] Site loads on the custom domain over HTTPS with a valid cert
  (Vercel-managed, automatic).
- [ ] `/robots.txt` and `/sitemap.xml` reference the custom domain, not
  `*.vercel.app`.
- [ ] Old `*.vercel.app` URL redirects (Vercel does this automatically for
  the assigned production domain) rather than serving duplicate content at
  two hostnames.

### 2.2 Google Search Console + Bing Webmaster Tools

**Problem.** Sitemap/robots exist but haven't been submitted anywhere —
there's no verified domain to do so yet (blocked by 2.1).

**Requirements.**
- Verify domain ownership in both Google Search Console and Bing Webmaster
  Tools (DNS TXT record or HTML meta tag — DNS preferred since it verifies
  the whole domain, not just one hosting deploy).
- Submit `sitemap.xml` in both.
- Set up email alerts for coverage errors / manual actions.

**Acceptance criteria.**
- [ ] Domain shows verified in both consoles.
- [ ] Sitemap submitted and shows 0 errors within a few days of submission.
- [ ] At least `/` is confirmed indexed (`site:yourdomain.com` search, or
  the console's URL inspection tool).

### 2.3 Structured data validation

**Problem.** `app/page.tsx` emits `WebApplication` + `FAQPage` JSON-LD, but
it's never been validated against a real (non-localhost) URL — some
validators reject `localhost`/preview hosts outright.

**Requirements.** Once 2.1 ships, run the production URL through Google's
Rich Results Test and the Schema.org validator. Fix any flagged issues
(commonly: missing required fields, or `FAQPage` questions not matching
visible on-page text verbatim — confirm the JSON-LD FAQ content still
matches what's rendered in `app/page.tsx`'s FAQ section, since drift
between the two risks a manual action for "structured data doesn't match
visible content").

**Acceptance criteria.**
- [ ] Rich Results Test shows 0 errors for both schema types on the
  production domain.
- [ ] JSON-LD FAQ content is verified identical to the rendered FAQ copy
  (add a comment or shared constant in `app/page.tsx` so they can't drift
  silently in a future edit).

### 2.4 Content hub / blog for long-tail queries

**Problem.** The landing page covers `/` well but there's no supporting
long-form content targeting queries like "instagram bio for dating,"
"instagram photo tips for dating apps," "how to make your instagram
dating-profile ready." This is the single biggest lever for organic
discovery given the product has no existing brand or backlinks.

**Requirements.**
- New route structure: `app/blog/page.tsx` (index) and
  `app/blog/[slug]/page.tsx` (article), or `app/guides/...` if "guides"
  fits the brand voice better than "blog" — pick one and be consistent
  (affects URL structure, so decide before publishing anything indexable).
- Content source: MDX files under e.g. `content/blog/*.mdx` compiled at
  build time (`@next/mdx` or `next-mdx-remote`), rather than a full CMS —
  a CMS is overkill for a handful of launch articles and adds an external
  dependency/cost before there's traffic to justify it. Revisit a CMS only
  if publishing cadence grows past what's comfortable in raw MDX files in
  the repo.
- Launch article list (starting set, expand over time): "Is your Instagram
  hurting your dating life?" (ties directly to the audit's core value
  prop), "The Instagram bio checklist daters actually read" (natural tie-in
  to the existing bio red-flag/archetype logic in the product itself — can
  literally reference the product's own scoring criteria as the article's
  authority), "What your Instagram grid says about you in the first 3
  seconds." Each article should end with a CTA linking to `/signup`.
- Each article needs: a title, meta description, canonical URL, and its
  own (minimal — `Article` schema, not duplicating the homepage's
  `WebApplication`/`FAQPage`) JSON-LD.
- Add every published article URL to `app/sitemap.ts`'s route list.

**Acceptance criteria.**
- [ ] At least 3 launch articles published, each targeting a distinct
  long-tail query, each linking to `/signup`.
- [ ] All article URLs present in `sitemap.xml` with correct `lastmod`.
- [ ] Articles pass the same Lighthouse/Core Web Vitals bar as the landing
  page (2.7) — long-form content shouldn't regress load performance.

### 2.5 Internal linking

**Problem.** Once 2.4 exists, there's no link graph connecting it back to
the product.

**Requirements.** From every blog article: a link back to `/` and a direct
`/signup` CTA, both with descriptive (not "click here") anchor text. From
the landing page: consider a "From the blog" teaser section linking to 2-3
recent articles, once there are enough to feature. Between articles:
related-article links where topically relevant (manual curation is fine at
launch article-count scale; don't build a recommendation engine for 3-5
articles).

**Acceptance criteria.**
- [ ] Every blog article links to `/signup` at least once.
- [ ] Landing page links to at least one blog article once 2.4 ships.

### 2.6 Meta descriptions & titles per route

**Problem.** Need to confirm `/login`, `/signup`, and future content routes
all have distinct, accurate `<title>`/description metadata rather than
inheriting Next's default title template unintentionally.

**Requirements.** Audit every route under `app/` for a `metadata` export
(or `generateMetadata` for dynamic routes like `app/blog/[slug]`) with a
unique title and description. `/login` and `/signup` are already
`noindex` (per README) but should still have sensible titles for
bookmarking/tab-switching UX, not just for crawlers.

**Acceptance criteria.**
- [ ] Every route has a unique `<title>`; no route silently falls back to
  a generic default.
- [ ] Verified via a crawl (e.g. `next build` output or a simple script
  hitting each route and checking `<title>`) rather than eyeballing.

### 2.7 Performance / Core Web Vitals pass

**Problem.** Never measured against a real deployed URL. Next 16 +
`next/og` (used for `app/icon.tsx`/`app/opengraph-image.tsx`) should
already perform well, but the dashboard's photo-upload flow
(`UploadForm`/`PhotoAuditCard`) handles user-provided images client-side and
is the most likely place for a real regression (large uploads, unoptimized
preview rendering).

**Requirements.** Run Lighthouse/PageSpeed Insights against the production
URL (post 2.1) for `/`, `/login`, `/signup`, and an authenticated dashboard
view. Pay particular attention to CLS/LCP on the upload flow given it
renders user images client-side. Fix anything scoring below "Good" 
thresholds (LCP < 2.5s, CLS < 0.1, INP < 200ms) — specifics depend on what
the audit finds, so no fix is prescribed here beyond "measure first."

**Acceptance criteria.**
- [ ] Lighthouse scores captured and recorded (even just as a note in this
  doc or a linked report) for the four routes above.
- [ ] All four in the "Good" Core Web Vitals band, or follow-up items filed
  here for any that aren't.

### 2.8 Analytics + conversion tracking

**Problem.** No GA4/Plausible/etc. today — no visibility into the
landing → signup → first audit → upgrade funnel, and no way to justify or
optimize paid acquisition spend (2.9) without it.

**Requirements.**
- Choose a provider: recommend **Plausible** (privacy-first, no cookie
  consent banner needed since it doesn't use cookies/fingerprinting,
  simpler given 1.1's note that the app currently needs no consent banner —
  adding GA4 would likely force adding one) unless there's a specific need
  for GA4's ecosystem (e.g. Google Ads conversion import for 2.9, in which
  case GA4 or a dual setup is more direct).
- Instrument events: `signup_started`, `signup_completed`,
  `audit_submitted`, `audit_completed`, `upgrade_clicked` (from the
  pricing UI once §4 ships). Fire from the relevant client components
  (`AuthForm`, `UploadForm`) and/or server actions/route handlers where
  more reliable (server-side firing avoids ad-blocker loss for critical
  conversion events like `signup_completed`).
- Respect the no-new-cookie-consent-burden goal from 1.1: if GA4 is chosen
  instead of a cookieless alternative, budget for a consent banner as part
  of this item, not as a surprise follow-up.

**Acceptance criteria.**
- [ ] Funnel events visible in the chosen analytics dashboard within a day
  of shipping.
- [ ] No new consent-banner requirement introduced without it being built
  alongside (if the chosen tool needs one).

### 2.9 SEM (paid search) readiness

**Problem.** Not started, and explicitly sequenced *after* 2.8 — paid
traffic to a site without conversion tracking or (until §4 ships) real
billing wastes spend.

**Requirements (once 2.8 + §4 are live).** Wire conversion tracking to
Google Ads/Meta Ads using 2.8's events (`signup_completed`, and ideally the
Stripe `checkout.session.completed` webhook from §4 as the strongest
conversion signal). Consider a dedicated landing-page variant for ad
traffic if message-matching to specific ad copy proves valuable — optional,
not needed for a first campaign. Document a CAC/LTV rationale (even a
rough one) before spending real budget, given the paid plan's price point
determines whether any given CAC is sustainable.

**Acceptance criteria.**
- [ ] Not started until 2.8 and §4 are both live — explicitly gated, not a
  parallel-track item.
- [ ] First campaign has conversion tracking wired before spend begins.

### 2.10 Backlinks / launch distribution

**Problem.** Not code work, but worth tracking: no launch distribution plan
yet (Product Hunt, relevant subreddits, dating-advice communities).

**Requirements.** Time distribution launch to after §4 (real billing) ships
and the app can sustain traffic/support real customers — a Product Hunt
launch pointed at an app that can't yet take payment wastes the one-shot
attention spike.

**Acceptance criteria.**
- [ ] Launch plan (channels + timing) drafted once §4 has a ship date.

## 3. Automated testing

Current coverage (`__tests__/`, Vitest): API route handlers (`audit`,
`auth-routes`, `change-password`) and core lib functions (`auth`,
`bio-staleness`, `emoji`, `rate-limit`), all with DB/Anthropic calls mocked.
That's solid unit/smoke coverage for backend logic but nothing exercises
the app end-to-end, nothing renders a React component, and nothing runs in
CI automatically.

### 3.1 Wire tests into CI

**Problem.** No `.github/workflows/*.yml` exists today — `npm test` only
runs when someone remembers to run it locally.

**Requirements.**
- Add `.github/workflows/ci.yml` triggered on `pull_request` and `push` to
  the main branch, running on `ubuntu-latest` with the Node version pinned
  to match `package.json`'s engine expectations (or Next 16's minimum).
- Steps: `npm ci`, `npm run lint`, `npm test` (Vitest), `npm run build`
  (catches type errors and build-time failures that `lint`/`test` might
  miss). Add `npm audit --audit-level=high` per 1.7.
- Required env vars for `npm run build`/`npm test`: check whether
  `lib/db.ts`/`lib/anthropic.ts`'s lazy-init pattern (client created on
  first call, not at module load — see `lib/db.ts`'s comment on this)
  means CI can run without real `TURSO_DATABASE_URL`/`ANTHROPIC_API_KEY`
  values. Tests already mock these (per README), so `npm test` shouldn't
  need real credentials; confirm `npm run build` also doesn't attempt a
  real DB connection at build time (Next's static analysis/page-data
  collection is exactly why the lazy-init pattern exists, per the code
  comment — validate this holds under `next build` in CI, not just `next
  dev`).
- Mark the workflow as a required status check on the branch protection
  rule for the main branch (repo admin setting, not a code change) so PRs
  can't merge with a red CI run.

**Acceptance criteria.**
- [ ] Workflow runs on every PR and push to main.
- [ ] `npm run build` succeeds in CI without real external credentials.
- [ ] Branch protection requires this check to pass before merge.

### 3.2 Component tests

**Problem.** No React component tests exist. `ScoreDial`, `VerdictBadge`,
`AuditResults`, `CoverageChecklist`, `PhotoAuditCard`, `UploadForm`,
`AuthForm`, `ChangePasswordForm`, `DashboardNav` all have zero direct
coverage today.

**Requirements.**
- Add `@testing-library/react`, `@testing-library/jest-dom`, and `jsdom` (or
  Vitest's `environment: 'happy-dom'`/browser mode) as dev dependencies;
  configure `vitest.config.mts` to use a DOM environment for `*.test.tsx`
  files (can scope by file pattern so existing lib/API tests keep their
  current node environment for speed).
- Priority coverage, in order:
  1. `UploadForm` — file selection updates preview state, validation
     rejects non-image files / over-size files (check what limits, if any,
     currently exist client-side vs. relying on the API route), submit
     button disabled state while a request is in flight.
  2. `AuditResults` / `ScoreDial` / `VerdictBadge` — render given a
     representative sample audit JSON result (construct a fixture matching
     the shape produced by `lib/anthropic.ts`'s structured output),
     including edge cases: a 0 score, a missing/partial coverage object
     (per README, the audit has a "coverage check on what it could and
     couldn't see" — verify the UI degrades sensibly when coverage is
     incomplete rather than assuming full data).
  3. `AuthForm` — client-side validation errors (invalid email format,
     short password) render before hitting the network; server-side error
     responses (e.g. the 401/409/429 shapes from the auth routes) render
     correctly when the fetch mock returns them.
  4. `ChangePasswordForm` — same pattern as `AuthForm` for its specific
     validation (current password required, new password length).
- Use MSW (Mock Service Worker) or simple `vi.fn()` fetch mocks for any
  component that calls an API route — consistent with how the existing API
  route tests already mock DB/Anthropic calls, so the mocking style stays
  uniform across the suite.

**Acceptance criteria.**
- [ ] Each component listed above has at least one rendering test and at
  least one interaction/edge-case test.
- [ ] Component tests run as part of `npm test` (same command, not a
  separate script) and therefore automatically covered by 3.1's CI wiring.

### 3.3 End-to-end tests

**Problem.** No E2E coverage — the golden path (signup → audit → result)
has never been verified by an automated browser test.

**Requirements.**
- Add Playwright (`@playwright/test`) with a config pointed at
  `npm run dev` (or a production-like `next build && next start`) for local
  runs, and add a corresponding CI job (can be the same workflow as 3.1 or
  a separate one if runtime becomes long — start combined, split later if
  needed).
- Golden-path scenarios:
  1. Signup → redirected/logged in → land on `/dashboard`.
  2. Submit an audit (bio text + at least one screenshot) → see a rendered
     result with a score and at least one recommendation.
  3. `/dashboard/history` lists the audit just created.
  4. `/dashboard/settings` changes password successfully; old password no
     longer works for login (a real integration check on `lib/auth.ts`'s
     bcrypt comparison, not just a mocked unit test).
  5. Hitting the daily audit cap (free plan, 1/day per `lib/rate-limit.ts`)
     shows the 429 UX, not a raw error.
  6. Logout clears the session; visiting `/dashboard` afterward redirects
     to `/login`.
- **Anthropic call handling:** these E2E runs must not depend on live
  Anthropic credentials or burn real API usage/cost on every CI run. Two
  options: (a) add a test-mode env flag read by `lib/anthropic.ts` that
  returns a canned structured response when set, or (b) intercept the
  outbound request at the network layer in Playwright
  (`page.route()`/`context.route()`) and return a fixture response. Prefer
  (a) if the audit route calls Anthropic server-side outside the browser's
  network stack (likely, since it's a Next.js API route) — Playwright's
  `route()` only intercepts requests initiated from the browser context, so
  a server-side `fetch` to Anthropic's API won't be interceptable that way.
  This makes (a) the correct choice here, not (b).
- Use a disposable/seeded Turso test database (or the same lazy-init
  pattern pointed at a local SQLite file — `@libsql/client` supports local
  file URLs) for CI runs, reset between test files to avoid cross-test
  pollution (e.g. the daily-rate-limit scenario needs a clean slate).

**Acceptance criteria.**
- [ ] All six golden-path scenarios above pass in CI without live
  Anthropic credentials.
- [ ] Test database is isolated per run (no shared state with production
  or between CI runs).

### 3.4 Auth security regression tests

**Problem.** Once 1.2 (login throttling) and 1.4 (session revocation) ship,
their correctness needs to be locked in by tests, not just verified once by
hand.

**Requirements.** Unit tests for `lib/login-rate-limit.ts` (from 1.2):
threshold behavior, window expiry, IP vs. email scoping independence.
Unit/integration tests for `lib/auth.ts`'s revocation additions (from 1.4):
a revoked `sid` fails `verifySessionToken`; a token issued before a user's
`sessions_invalidated_at` fails; a token issued after does not.

**Acceptance criteria.**
- [ ] Tests exist and are added to the suite covered by 3.1's CI run —
  written alongside 1.2/1.4's implementation, not as a separate later pass
  (regression tests written after the fact tend not to get written at all).

### 3.5 Coverage reporting

**Problem.** No visibility into how much of the codebase the test suite
actually exercises.

**Requirements.** Enable `vitest --coverage` (using `@vitest/coverage-v8`)
as a CI step (3.1). Start by reporting only (no enforced threshold — the
codebase has real coverage gaps today per this whole section, and a hard
gate before closing those gaps would just block unrelated PRs). Revisit
adding a minimum-threshold gate once the gaps in 3.2/3.3 are substantially
closed.

**Acceptance criteria.**
- [ ] Coverage report generated on every CI run and visible (uploaded as a
  CI artifact, or posted as a PR comment via a common Action).
- [ ] No enforced threshold yet — explicit, documented decision (matches
  1.2/1.7's pattern of recording deliberate scope decisions rather than
  leaving them ambiguous).

### 3.6 Stripe integration tests

**Problem.** N/A until §4 ships — flagged here so it's not forgotten once
billing lands.

**Requirements.** Test-mode checkout session creation (mocking the Stripe
SDK call, verifying the right price ID / metadata is passed); webhook
signature verification (valid signature accepted, tampered payload
rejected); webhook handler idempotency (the same `event.id` processed twice
doesn't double-apply a plan upgrade — requires the handler to check/record
processed event IDs, which should be designed into §4's webhook handler
from the start, not bolted on later). Use Stripe's official test
fixtures/CLI (`stripe trigger checkout.session.completed`, etc.) against a
local webhook listener during development, and canned fixture payloads
(captured once, replayed) for the actual CI-run unit tests — CI shouldn't
depend on the Stripe CLI being installed/authenticated.

**Acceptance criteria.**
- [ ] Ships alongside §4, not as a follow-up PR — a payments webhook
  handler without tests for idempotency and signature verification is not
  considered done.

## 4. Stripe billing — real payments and plan access

Today `users.plan` (`free`/`paid`) is hand-edited in the DB (`update users
set plan = 'paid' where email = ...`, per the README). There is no
checkout, no customer record, no webhook handling, and no way for a user to
upgrade, downgrade, or cancel themselves. This is the product's core
monetization unlock, sequenced last here because it depends on the legal
groundwork (§1.1) and benefits from having CI/tests (§3) in place before
introducing a payments surface.

### 4.1 Schema

**Requirements.** Add to `users` (migration in `schema.sql`, applied via
`scripts/init-db.mjs`'s existing "add what's missing" pattern — check its
current implementation to follow the same idempotent-`ALTER TABLE` style
rather than introducing a different migration mechanism):
```sql
alter table users add column stripe_customer_id text;
alter table users add column stripe_subscription_id text;
alter table users add column subscription_status text; -- active | past_due | canceled | incomplete | null
alter table users add column current_period_end text; -- ISO datetime
```
Add a `processed_stripe_events` table for 3.6's idempotency requirement:
```sql
create table if not exists processed_stripe_events (
  event_id text primary key,
  processed_at text not null default (datetime('now'))
);
```
Keep `plan` as a derived/denormalized convenience column (still read by
`lib/rate-limit.ts` today) but make `subscription_status` the source of
truth going forward — see 4.5.

**Acceptance criteria.**
- [ ] Migration is idempotent (safe to re-run against a DB that already
  has these columns, matching `scripts/init-db.mjs`'s existing pattern).
- [ ] Applied to production before any checkout code ships (schema
  changes should land and be verified independently of the feature code
  that depends on them).

### 4.2 Product/price setup

**Requirements.** Create the paid plan as a Stripe Product + recurring
Price (monthly at minimum; annual optional, decide based on whether an
annual discount makes sense for this price point) in the Stripe Dashboard,
**test mode first**. Store price ID(s) in env vars (`STRIPE_PRICE_ID_MONTHLY`,
etc.), never hardcoded in route code, so switching from test to live prices
at launch is a config change, not a code change.

**Acceptance criteria.**
- [ ] Test-mode product/price exist and their IDs are in `.env.example`
  (with placeholder values) and documented in the README's env var list.

### 4.3 Checkout flow

**Requirements.**
- `POST /api/billing/checkout` (`app/api/billing/checkout/route.ts`),
  requires an authenticated session (reuse `getCurrentUserId()` from
  `lib/auth.ts`, returning 401 if absent — same pattern as
  `/api/audit` presumably already uses for its own auth check).
- Creates a Stripe Checkout Session (`mode: 'subscription'`) with
  `client_reference_id` set to the internal `user.id`, and/or
  `metadata: { userId }` on the session (belt-and-suspenders — the webhook
  handler in 4.5 needs a reliable way to map the Stripe event back to the
  internal user even if the customer wasn't pre-created).
- If the user already has a `stripe_customer_id` (returning customer,
  e.g. resubscribing after a cancellation), pass `customer:
  user.stripe_customer_id` to avoid creating duplicate Stripe customer
  records for the same person.
- `success_url` → `${SITE_URL}/dashboard?upgraded=1` (using `lib/site.ts`'s
  `SITE_URL`, not a hardcoded host); `cancel_url` → back to the
  pricing section (e.g. `${SITE_URL}/dashboard/settings`).
- Returns `{ url: session.url }` for the client to redirect to (Stripe
  Checkout is hosted, not embedded — simplest integration, no PCI scope
  taken on by this app).

**Acceptance criteria.**
- [ ] Authenticated user clicking "Upgrade" lands on Stripe's hosted
  checkout page with the correct price.
- [ ] Returning customer reuses their existing `stripe_customer_id` rather
  than creating a duplicate.
- [ ] Unauthenticated request to this endpoint returns 401, not a checkout
  URL.

### 4.4 Customer portal

**Requirements.** `POST /api/billing/portal` (`app/api/billing/portal/route.ts`),
same auth pattern as 4.3. Requires `user.stripe_customer_id` to exist
(return a clear error — not a 500 — if a user without a Stripe customer
record somehow hits this, e.g. a free user who never checked out). Creates
a Stripe Billing Portal session with `return_url` back to
`/dashboard/settings`. Returns `{ url }` for redirect, same shape as 4.3.

**Acceptance criteria.**
- [ ] Subscribed user can update payment method, view invoices, and cancel
  entirely through Stripe's hosted portal without any custom UI built for
  those flows.
- [ ] Free user (no `stripe_customer_id`) gets a sensible error, not a
  crash, if this endpoint is somehow reached.

### 4.5 Webhooks

**Requirements.**
- `POST /api/webhooks/stripe` (`app/api/webhooks/stripe/route.ts`). Must
  read the **raw** request body for signature verification
  (`stripe.webhooks.constructEvent(rawBody, signature, STRIPE_WEBHOOK_SECRET)`)
  — in a Next.js App Router route handler this means reading
  `await req.text()`, not `req.json()`, before verification.
- Idempotency (ties to 4.1/3.6): on receiving an event, check
  `processed_stripe_events` for `event.id`; if present, return 200
  immediately without reprocessing; if absent, process then insert the
  event ID — do this as close to atomically as the DB allows (a single
  transaction if `@libsql/client` supports one easily, otherwise
  insert-then-process-then-confirm with the insert as an early claim).
- Handle at minimum:
  - `checkout.session.completed` — read `client_reference_id`/`metadata.userId`,
    store `stripe_customer_id` and `stripe_subscription_id` on the user row,
    set `subscription_status = 'active'`.
  - `customer.subscription.updated` — sync `subscription_status` and
    `current_period_end` from the event's subscription object. This is the
    source of truth for status changes (upgrades, downgrades, renewals),
    not the checkout redirect, which only signals initial intent.
  - `customer.subscription.deleted` — set `subscription_status = 'canceled'`.
  - `invoice.payment_failed` — set `subscription_status = 'past_due'`;
    once 1.5's email provider exists, optionally notify the user (explicit
    "optionally" — don't block shipping billing on the email piece if it's
    not ready yet, just don't silently swallow the signal either — at
    minimum log/surface it for manual follow-up).
- All handlers look up the user by `stripe_customer_id` (present on the
  event's `customer` field for subscription/invoice events) rather than by
  re-deriving from `client_reference_id`, which is only reliably present on
  the initial `checkout.session.completed` event.

**Acceptance criteria.**
- [ ] Signature verification rejects tampered/unsigned payloads (test with
  an intentionally wrong secret in a test, per 3.6).
- [ ] Replaying the same event twice (via `stripe trigger` or a manual
  duplicate POST) does not double-process — covered by 3.6's tests.
- [ ] All four event types update `users` rows correctly, verified against
  Stripe's test-mode event log during manual QA before launch.

### 4.6 Gate on `subscription_status`, not just `plan`

**Requirements.** `lib/rate-limit.ts`'s `getUserPlan` currently reads
`plan` directly. Add `getEffectivePlan(userId)` that:
- Returns `'paid'` if `subscription_status === 'active'`.
- **Decision needed:** grace period for `'past_due'` — recommend treating
  `past_due` as still `'paid'` for a short grace window (e.g. 3 days from
  `current_period_end`) before demoting to `'free'`, matching how most SaaS
  handles a temporarily failed card without immediately cutting access;
  document the chosen window here once decided.
- Returns `'free'` for `'canceled'`, `null`, or an expired grace period.
- Replace `lib/rate-limit.ts`'s direct `plan` read with this function, and
  use it as the single source for any future paywalled UI check (e.g. the
  pricing page in 4.7 showing current effective plan).

**Acceptance criteria.**
- [ ] `lib/rate-limit.ts` and any future gating logic call
  `getEffectivePlan`, not raw `users.plan`.
- [ ] Grace-period policy is explicitly decided and documented (not left as
  an implicit default), with a unit test locking in the boundary behavior
  (exactly at the grace-period edge).

### 4.7 Pricing / upgrade UI

**Requirements.**
- A pricing section, either on the landing page (`app/page.tsx`) or
  gated to `/dashboard/settings` (recommend: both — landing page for
  pre-signup conversion per 2.9's SEM tie-in, settings page for existing
  users deciding to upgrade).
- "Upgrade" button → calls 4.3's checkout endpoint, redirects to the
  returned URL.
- "Manage billing" button (shown only once `stripe_customer_id` exists) →
  calls 4.4's portal endpoint.
- `/dashboard/settings` displays current effective plan (via 4.6), and
  once subscribed, renewal date (`current_period_end`) and status — with a
  clear, non-alarming treatment of `past_due` (e.g. "Payment issue — update
  your card" with a direct portal link) distinct from `active`.

**Acceptance criteria.**
- [ ] Free user sees an upgrade path from both the landing page and
  settings.
- [ ] Subscribed user sees accurate renewal date/status and a working
  "manage billing" link.
- [ ] `past_due` status surfaces an actionable prompt, not a silent
  demotion the user doesn't understand.

### 4.8 Env vars

**Requirements.** `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`,
`STRIPE_PRICE_ID_MONTHLY` (and `_ANNUAL` if applicable) — add to
`.env.example` with placeholder values and to Vercel project settings
(test-mode values in preview/dev environments, live-mode values only in
production). Document the test→live key swap explicitly as a deploy-day
checklist item in the README, since forgetting to swap is a classic launch
mistake (charging test-mode cards in production, or vice versa).

**Acceptance criteria.**
- [ ] All Stripe env vars documented in `.env.example` and README.
- [ ] Test/live key separation by environment is explicit, not manual
  discipline alone (e.g. a startup check that warns if a live secret key is
  used with `NODE_ENV !== 'production'`, or vice versa, is worth the small
  effort to prevent a costly mistake).

### 4.9 Local webhook testing

**Requirements.** Document in the README: `stripe listen --forward-to
localhost:3000/api/webhooks/stripe` for local development, plus
`stripe trigger <event-name>` examples for each event type handled in 4.5,
so webhook logic can be developed and manually verified without deploying
or waiting for a real card transaction.

**Acceptance criteria.**
- [ ] README has a "Testing Stripe webhooks locally" section with the
  exact commands needed, verified to work by actually running them once.

### 4.10 Tax/compliance basics

**Requirements.** Decide whether to enable Stripe Tax (automatic
calculation/remittance) or handle tax manually at this scale — recommend
enabling Stripe Tax from day one given how little it costs relative to the
compliance risk of getting sales tax wrong, but this is a business decision
more than a technical one, flagged here rather than decided unilaterally.
Confirm §1.1 (privacy policy + ToS, including refund policy) ships before
or alongside this — taking payment without a stated refund/cancellation
policy is a chargeback and trust risk.

**Acceptance criteria.**
- [ ] Tax handling approach explicitly decided and documented.
- [ ] §1.1's ToS includes a refund/cancellation policy before checkout goes
  live in production (test mode is fine without it).

### 4.11 Failure/edge-case UX

**Requirements.** Free user hitting the daily cap (`lib/rate-limit.ts`,
1/day) sees a 429 message that links to the upgrade flow (4.7), not just a
generic "come back tomorrow" — turn the rate-limit wall into a conversion
opportunity. A `past_due` paid user attempting an audit should see a
prompt to fix payment via the portal link (4.4), distinguishable from the
free-tier rate-limit message so they understand *why* they're blocked.

**Acceptance criteria.**
- [ ] Free-tier rate-limit message includes an upgrade CTA/link.
- [ ] `past_due` users get a distinct message pointing at the billing
  portal, not the generic free-tier rate-limit copy.

---

## Suggested sequencing

1. **Carried-over hardening (§1)** first — small, self-contained, and the
   legal items (1.1) need to exist before billing anyway.
2. **SEO foundations (§2: 2.1 custom domain, 2.2 Search Console, 2.4
   content hub)** — can run in parallel with §1; content hub is the long
   lead-time item, worth starting early.
3. **CI + component/E2E tests (§3)** — put a safety net in place before
   introducing a payments surface in §4.
4. **Stripe billing (§4)** — the product's core unlock, sequenced last so
   it lands on top of the legal groundwork and test coverage above.
