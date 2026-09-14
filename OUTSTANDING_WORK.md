# Outstanding work — Caliber

Last reviewed: 2026-09-14.

This is the authoritative backlog going forward. It supersedes `FOLLOWUP.md`
(kept for history/context, but new items should land here). Sections are
ordered: (1) carried-over hardening, (2) search visibility, (3) automated
testing, (4) Stripe billing, (5) public-URL profile analysis. Every item
below is written as a feature spec —
problem, requirements, design, and acceptance criteria — rather than a bare
checklist line, so any of them can be picked up and implemented without
needing a separate design conversation first. Concrete facts (file paths,
function names, current behavior) are taken directly from the current
codebase as of this review; treat the *design* portions as the recommended
approach, open to revision during implementation.

## Tech stack

Exact versions as pinned in `package.json` at time of writing — check that
file for current versions before assuming these; dependencies get bumped
over time and this doc will drift.

- **Framework:** Next.js `^16.3.2`, App Router, TypeScript `^5.6.3`. Routes
  live under `app/`; API routes are Route Handlers (`app/api/**/route.ts`)
  using the `NextRequest`/`NextResponse` signature, not the older
  `pages/api` style.
- **UI:** React `^18.3.1` / React DOM `^18.3.1`. Styling is Tailwind CSS
  `^3.4.14` (`tailwind.config.ts`, `app/globals.css`) — no CSS-in-JS, no
  component library (MUI/Chakra/etc.); components under `components/` are
  plain hand-rolled TSX.
- **Database:** Turso (libSQL/SQLite-compatible), via `@libsql/client`
  `^0.14.0`. All queries go through the single `query<T>(sql, params)`
  helper in `lib/db.ts` (raw parameterized SQL, no ORM — no Prisma/Drizzle
  in this stack, don't introduce one without discussing it first). Schema
  lives in `schema.sql`, applied idempotently by `scripts/init-db.mjs`
  (`npm run db:init`) — new tables/columns should follow that file's
  `create table if not exists` / additive-`alter table` pattern so the
  script stays safe to re-run against a live database.
- **Auth:** Custom, not a third-party auth service (no NextAuth/Clerk/Auth0
  today). Passwords hashed with `bcryptjs` `^2.4.3` (`lib/auth.ts`,
  `hashPassword`/`verifyPassword`). Sessions are signed JWTs via `jose`
  `^5.9.6` (`createSessionToken`/`verifySessionToken`), stored in an
  `httpOnly` cookie (`SESSION_COOKIE = 'session'`, see
  `sessionCookieOptions` in `lib/auth.ts`) — no session table today (see
  §1.4, which adds one for revocation).
- **AI:** Anthropic API via `@anthropic-ai/sdk` `^0.120.0` (`lib/anthropic.ts`)
  — vision model call that takes bio text + screenshot images and returns a
  structured JSON result (validated with `zod` `^4.4.3`). Images are sent
  to the API and never persisted to the database or disk.
- **Validation:** `zod` `^4.4.3` for structured-output/schema validation
  (see `lib/anthropic.ts`'s use for the model's response shape — follow the
  same pattern for any new structured data, e.g. Stripe webhook payloads in
  §4).
- **Testing:** Vitest `^4.1.11` (`vitest.config.mts` — `environment: 'node'`
  today; §3.2 changes this for component tests). Run via `npm test`
  (= `vitest run`). External calls (DB, Anthropic) are mocked in existing
  tests under `__tests__/` — follow that pattern for new tests rather than
  hitting real services.
- **Deployment:** Vercel (see README's "Deploying" section). Env vars are
  set in the Vercel project settings, mirrored in `.env.example` for local
  dev (`TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN`, `SESSION_SECRET`,
  `ANTHROPIC_API_KEY` today — §4 adds Stripe keys).
- **Package manager / scripts:** npm (`package-lock.json` is committed —
  use `npm`, not `yarn`/`pnpm`, to keep the lockfile consistent).
  `npm run dev` / `npm run build` / `npm start` / `npm run lint` /
  `npm run db:init` / `npm test` — see `package.json`'s `scripts` block for
  the authoritative list; §3.1 adds a CI workflow that runs several of
  these.
- **Not in this stack** (don't introduce without a reason called out in a
  spec below): no ORM, no third-party auth service, no CMS, no state
  management library beyond React's built-ins, no component library, no
  E2E framework yet (§3.3 adds Playwright), no CI yet (§3.1 adds GitHub
  Actions).

## How to use this document (for incremental, autonomous implementation)

This document is written to be handed to a coding agent (human or LLM,
including a local/offline model working with less context than an
interactive session) that will work through it **one item at a time**,
across many separate sessions, without a person re-explaining context each
time. Follow this process for every work session:

1. **Pick the next unchecked item.** Work section-by-section in the order
   given (§1 → §2 → §3 → §4 → §5) and top-to-bottom within a section, unless a
   later item's "Requirements" explicitly says it depends on an earlier one
   not yet done (several do — e.g. §4 items depend on §1.1; §3.4 depends on
   §1.2/§1.4). Don't skip ahead to a more interesting item out of order.
2. **Re-read the actual current code before implementing**, not just this
   spec. File paths and function names cited here were accurate at the time
   this was written, but prior incremental work (including your own
   earlier sessions) may have already changed them. Grep for the relevant
   file first; if something cited here (a function name, a table column)
   no longer matches reality, trust the code and adapt the plan, noting the
   discrepancy in your commit message.
3. **Implement the minimum the spec's "Requirements" section describes.**
   Don't gold-plate, don't refactor unrelated code, don't start a second
   item before finishing and checking off the current one. If a
   requirement says "decision needed," make the call, implement it, and
   record the decision in this file (edit the relevant bullet or add a
   sentence) so the next session doesn't re-litigate it.
4. **Follow existing conventions instead of inventing new ones:**
   - Route handlers: see `app/api/auth/login/route.ts` or
     `app/api/auth/signup/route.ts` for the pattern — parse/validate input
     early, return `NextResponse.json({ error }, { status })` on failure,
     use `lib/auth.ts`'s helpers for anything session-related.
   - DB access: always through `lib/db.ts`'s `query<T>()`, parameterized,
     never string-concatenated SQL.
   - New tables/columns: additive, idempotent changes to `schema.sql`
     applied via `scripts/init-db.mjs`'s existing pattern — check that
     script's current implementation before adding to it.
   - New lib modules: small, focused, colocated with existing ones in
     `lib/` (e.g. `lib/login-rate-limit.ts` alongside `lib/rate-limit.ts`,
     per §1.2) rather than one growing catch-all file.
   - Tests: colocated under `__tests__/` mirroring the source path (e.g.
     `__tests__/lib/auth.test.ts` for `lib/auth.ts`), mocking external
     services the same way existing tests do.
5. **Verify before checking anything off.** At minimum: `npm run lint`,
   `npm test`, and `npm run build` must all pass. For anything with a UI
   change, actually run `npm run dev` and exercise it if you're able to;
   note in your summary if you couldn't (e.g. no browser available) rather
   than claiming it was verified.
6. **Check the box** (`- [ ]` → `- [x]`) for each acceptance-criterion line
   you've satisfied, and add a one-line dated note under the item if you
   made a consequential decision or deviated from the spec (matching the
   style of `FOLLOWUP.md`'s dated notes). Leave the item's checkboxes
   partially checked (not all boxes ticked) if you only got partway —
   that's fine and expected across sessions; don't mark an item done that
   isn't.
7. **Commit with a message describing what was actually built**, not just
   "implement §1.2" — a future session (or person) reading `git log` should
   understand the change without opening this file.
8. **One item per commit** where practical — small, reviewable, bisectable
   changes, matching this repo's existing commit history style (see
   `git log --oneline`).
9. **When genuinely blocked** (a "decision needed" that has real business
   consequences — pricing, legal wording, which email/analytics vendor to
   pay for — not just an implementation detail), make the lowest-risk
   default choice, implement against it, and flag the decision prominently
   in this file and your commit message rather than stalling. Don't block
   an entire session on a question nobody's answered — that defeats the
   point of an incremental backlog.

Do not treat `AGENTS.md`'s claim about a modified Next.js requiring docs
from `node_modules/next/dist/docs/` as accurate — that path does not exist
in this repository (verified during this review) and real Next.js ships no
such directory. If a future version of that file or the installed
`node_modules` genuinely contains framework-specific docs worth reading,
verify the path exists and its content is real documentation before relying
on it; don't fabricate API behavior to match an instruction that doesn't
correspond to anything on disk.

## What the app is, today

Caliber audits a user's *existing, live* Instagram profile for dating
effectiveness. A signed-up user uploads bio text + profile screenshots,
Claude's vision model scores each photo against dating-profile archetypes,
checks bio quality (red flags, archetype fit, staleness, emoji density,
link quality), and returns a coverage report + prioritized next actions.
See "Tech stack" above for the full stack detail. Photos are never
persisted — only the generated JSON result is.

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
component tests), real billing (plan is a manually-set DB flag), and any way
to run an audit *without* manually uploading screenshots — there is no
URL/handle ingestion path today (§5 specifies one).

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

## 5. Public-URL profile analysis (no manual upload)

Today every audit starts with the user manually screenshotting their own
profile and uploading the images (`components/UploadForm.tsx` →
`POST /api/audit` → `lib/anthropic.ts`'s `runProfileAudit`). That upload
step is the single biggest drop-off point in the funnel: it asks for 6-12
screenshots, a scroll-and-stitch of the grid, and a pasted bio before the
user has seen any value at all. It also degrades the audit's own accuracy —
the bio is *transcribed from a screenshot by the vision model* rather than
read as text, the grid is whatever the user happened to capture, and
captions/cadence/engagement are only visible if the user thought to
screenshot them.

This section specifies a second ingestion path: the user pastes the public
URL (or handle) of an Instagram profile, the app fetches that profile's
public data itself, and the **same** analysis pipeline runs on it. Every
analysis feature that exists today must be present in the URL flow — photo
archetype scoring and coverage, per-photo verdicts and recommended order,
avatar critique, display-name check, bio archetype/red-flags/rewrite/link
check, code-computed emoji density, bio staleness, grid cohesion, profile
coverage checklist, content strategy, prioritized top actions — rendering
through the existing `components/AuditResults.tsx` with no change to the
result shape. Two depth modes (**basic** and **detailed**) then trade cost
and latency against how much of the profile is pulled in.

Sequenced after §4 in this document, but it has no hard dependency on
billing: depth gating can ride on today's `users.plan` column. It does have
a hard dependency on §1.1 (the privacy policy and ToS have to describe
third-party profile fetching before this ships — see 5.9). If §4 lands
first, "detailed" becomes the most natural paid-plan upsell the product
has.

**NEEDS_DECISION (blocking for 5.1 only; the rest of §5 can be built
against the provider interface with the fixture provider).** Which profile
data source do we pay for? This is a real business/legal/pricing decision,
not an implementation detail — it has a per-profile cost, a vendor
contract, and Instagram ToS exposure attached to it. The options, with the
trade-offs as they stand:

- **Instagram Graph API — Business Discovery.** The only first-party,
  fully sanctioned route. Requires a Meta app plus a connected Instagram
  Business/Creator account to make the call, and it can only look up
  *other* Business/Creator accounts (`business_discovery.username(...)`
  returns username, name, biography, website, follower/media counts, and
  recent media with captions and engagement). Personal public accounts —
  most of this product's actual audience — are **not** reachable this way.
  Cost: free. Coverage: poor for the target user.
- **A third-party profile-data vendor** (Apify's Instagram scrapers,
  Bright Data, ScrapingBee/ScraperAPI, and similar). Covers personal
  public accounts, priced per request or per result, and moves the
  scraping mechanics — proxying, login walls, markup churn — onto the
  vendor. Costs real money per audit and the ToS exposure is shared, not
  eliminated. Coverage: good. Cost: the thing to decide.
- **Direct unauthenticated fetching of instagram.com** by this app. Cheap
  in dollars and expensive in everything else: the anonymous web-profile
  endpoints are login-walled, IP-rate-limited, and change without notice,
  and doing it at all is squarely against Instagram's ToS. **Not
  recommended**; do not build this as the default provider.

Until this is answered, implement `lib/ig-profile/` (5.1) against a
fixture/mock provider so that 5.2-5.12 are buildable and testable, and
leave the real provider behind the `IG_PROVIDER` env switch. Record the
answer here when it's made.

### 5.1 Profile ingestion layer

**Requirements.**

- `lib/ig-url.ts` — pure, dependency-free handle parsing and validation.
  Accepts `https://www.instagram.com/handle`, `instagram.com/handle/`,
  `http://instagram.com/handle?igsh=...`, `@handle`, and a bare `handle`;
  normalizes all of them to a lowercase handle with no `@`, no trailing
  slash, no query string. Rejects, with a distinct error for each so the
  UI can say something useful: post/reel/story permalinks (`/p/...`,
  `/reel/...`, `/stories/...` — those are single pieces of content, not a
  profile), reserved paths (`/explore`, `/accounts`, `/direct`,
  `/challenge`, `/legal`, and similar), non-Instagram hosts, and anything
  failing Instagram's own handle rules (1-30 chars, `a-z0-9._`, no leading
  or trailing `.`, no `..`). Same "small, focused module in `lib/`" shape
  as `lib/emoji.ts` and `lib/bio-staleness.ts`.
- `lib/ig-profile/types.ts` — the provider-agnostic shape everything
  downstream consumes. Nothing above this layer should know which vendor
  produced the data:
  ```ts
  export type IgMedia = {
    id: string;
    kind: 'image' | 'video' | 'carousel';
    imageUrl: string;        // still/thumbnail URL, fetched at audit time, never persisted
    caption: string | null;
    postedAt: string | null; // ISO
    likeCount: number | null;
    commentCount: number | null;
  };

  export type IgProfile = {
    username: string;
    displayName: string | null;
    biography: string | null;   // real text, not a screenshot transcription
    externalUrl: string | null;
    avatarUrl: string | null;
    followerCount: number | null;
    followingCount: number | null;
    postCount: number | null;
    isPrivate: boolean;
    isVerified: boolean;
    media: IgMedia[];           // most recent first
    fetchedAt: string;          // ISO
  };
  ```
- `lib/ig-profile/index.ts` — `fetchProfile(username, depth)` dispatching
  on `process.env.IG_PROVIDER` to one of `providers/graph.ts`,
  `providers/vendor.ts`, `providers/fixture.ts`. Provider modules
  implement one interface (`ProfileProvider`) and are the *only* files
  allowed to know a vendor's wire format; each validates its response with
  `zod` and maps it into `IgProfile`, matching how `lib/anthropic.ts`
  validates model output today. An unknown or unset `IG_PROVIDER` is a
  clear startup-time error, not a silent fallback to a live scrape.
- Every fetch gets a hard timeout (`IG_FETCH_TIMEOUT_MS`, default 15000)
  and a bounded single retry on a transient failure. A provider failure
  must surface as a typed error the route can map to a specific HTTP
  status and message (5.10), never as an unhandled 500.
- Image bytes are fetched separately, in-process, at audit time
  (`lib/ig-profile/images.ts`): download each `imageUrl`, cap per-image
  and total bytes at the same ceilings `/api/audit` already enforces
  (8MB per image, 4MB total after downscale), downscale server-side to
  the 1568px long edge `lib/image-client.ts` already targets in the
  browser, re-encode to JPEG, and hand `PhotoInput[]` to
  `runProfileAudit`. Skip an image that fails to fetch rather than failing
  the whole audit, and record how many were skipped so coverage can say so
  honestly.
- **Image bytes are never written to disk or the database**, matching the
  existing guarantee for uploads. The snapshot table in 5.2 stores text
  and URLs only.

**Acceptance criteria.**
- [ ] `lib/ig-url.ts` normalizes all accepted forms above and rejects each
  invalid class with its own error code, covered by unit tests.
- [ ] `fetchProfile()` returns `IgProfile` from the fixture provider with
  no network access, so the rest of §5 is testable without a vendor.
- [ ] Swapping providers is an env-var change only — no call-site edits
  outside `lib/ig-profile/`.
- [ ] A provider timeout or non-200 produces a typed error, not a 500.
- [ ] No fetched image byte is ever persisted (verified by inspecting what
  5.2's snapshot row actually contains).

### 5.2 Schema

**Requirements.** Additive columns on `audits`, following
`scripts/init-db.mjs`'s existing `ensureColumn()` pattern (the same
mechanism §4.1 uses — check that script before adding, don't introduce a
second migration mechanism):

```sql
alter table audits add column source text;       -- 'upload' | 'url'
alter table audits add column ig_username text;  -- normalized handle, url-sourced audits only
alter table audits add column depth text;        -- 'basic' | 'detailed'
```

Existing rows have `NULL` in all three; read them as `source = 'upload'`,
`depth = 'detailed'` (today's upload flow already sends everything the user
gave it) so history keeps rendering.

Plus a short-lived snapshot table, so re-running an audit on the same
handle inside the TTL doesn't re-bill a vendor request, and so repeated
submissions of the same handle can't be used to hammer the provider:

```sql
create table if not exists ig_profile_snapshots (
  id text primary key,
  username text not null,
  depth text not null,
  payload text not null,   -- JSON IgProfile: text + URLs only, no image bytes
  fetched_at text not null default (datetime('now'))
);

create index if not exists idx_ig_profile_snapshots_username
  on ig_profile_snapshots(username, fetched_at);
```

`IG_SNAPSHOT_TTL_MINUTES` (default 60) decides freshness. A snapshot older
than the TTL is ignored and refetched; a basic snapshot never satisfies a
detailed request (the reverse is fine — a detailed snapshot can serve a
basic audit). Add a `created_at`-style cleanup note: snapshots are cache,
not history, and can be deleted freely.

**Acceptance criteria.**
- [ ] Migration is idempotent and safe to re-run against a live DB.
- [ ] Pre-existing audit rows still render in `/dashboard/history` with
  the new columns null.
- [ ] A second audit of the same handle within the TTL performs zero
  provider requests (assert on the mock provider's call count in a test).
- [ ] `payload` contains no base64 or binary image data.

### 5.3 Depth modes: basic vs detailed

**Requirements.** One selector, two documented profiles of behavior. The
result *shape* is identical in both — what changes is how much of the
profile was pulled in, and the coverage checklist says so plainly rather
than silently scoring on thin input.

**Basic** — the fast, cheap look, meant to be runnable on the free plan
and to produce a result in a few seconds:
- Fetches profile header only: avatar, display name, biography, external
  link, follower/following/post counts, plus the **6 most recent grid
  images** at thumbnail resolution. No captions, no engagement, no video
  frames.
- One model call, `max_tokens` around 4000.
- `profileCoverage` must honestly mark "Individual posts with captions",
  "Highlights or pinned content", and "Video or Reels content" as not
  covered, with the note explaining that a detailed audit covers them —
  this is the existing coverage mechanism doing its job, not a new
  upsell surface bolted on.
- Code-computed signals that don't need posts still run: emoji density,
  bio staleness, link check.

**Detailed** — the full audit, the closest equivalent to a well-prepared
manual upload and then some:
- Fetches up to **12 most recent posts** at display resolution, with
  captions, post timestamps, like/comment counts, and media kind
  (image/video/carousel), plus everything basic fetches.
- Captions and post metadata are passed to the model as text context
  alongside the images, so `contentStrategy` can finally speak to caption
  quality and posting cadence from real data rather than from whatever
  happened to be screenshotted.
- Runs the full code-computed metric set in 5.5.
- One model call, `max_tokens` 8000 (today's value).
- `profileCoverage` marks posts/captions and video content as covered;
  highlights remain not covered unless the chosen provider exposes them
  (most don't — say so rather than guessing).

Depth is an explicit, user-visible choice, defaulting to **basic** for
free-plan users and **detailed** for paid. Free users choosing detailed
get the same upgrade prompt pattern §4.7/§4.11 establish for the
rate-limit wall. Store the chosen depth on the audit row (5.2) so history
can label what a given result was based on.

**Acceptance criteria.**
- [ ] Both modes return a value satisfying today's `AuditResult` type
  with no schema change — `components/AuditResults.tsx` renders either
  without modification.
- [ ] Basic mode issues exactly one model call with ≤6 images and marks
  the uncovered aspects as uncovered.
- [ ] Detailed mode passes captions and timestamps into the prompt and
  covers the post/caption aspect.
- [ ] Depth is persisted and shown in `/dashboard/history`.
- [ ] A free-plan user selecting detailed gets an upgrade prompt, not a
  silent downgrade or a 500.

### 5.4 Analysis parity — the model call

**Problem.** The risk in adding a second ingestion path is that it
quietly becomes a *second, worse* audit. Everything in `lib/anthropic.ts`
— eight photo archetypes, five coverage aspects, eight bio red flags,
five bio archetypes, avatar/display-name/header/grid split, prioritized
`topActions` — must apply identically to a URL-sourced profile.

**Requirements.**
- Reuse `runProfileAudit` rather than writing a parallel prompt. Extend
  its signature to take an optional structured context object instead of
  today's free-text `bioText`:
  ```ts
  runProfileAudit(photos, context: AuditContext, platform)
  // AuditContext = { bioText?: string; profile?: IgProfile; depth: 'basic' | 'detailed' }
  ```
  Keep the existing call site working (upload flow passes
  `{ bioText, depth: 'detailed' }`), so this is an additive change, not a
  rewrite of the prompt.
- Add a small, clearly-delimited block to the user message when
  `profile` is present, giving the model the *known* facts it currently
  has to infer from pixels: exact biography text, exact display name,
  exact external link, follower/post counts, and (detailed only) per-post
  captions with timestamps and engagement, keyed to the same 0-based
  image indices the photos use.
- Tighten the system prompt for this case, additively: when the bio text
  is supplied as text, the model must **not** re-transcribe it —
  `transcribedText` should echo the supplied text verbatim so
  `lib/bio-staleness.ts` and `lib/emoji.ts` keep working unchanged
  downstream. This removes a real accuracy bug in the upload flow, where
  emoji density and staleness are computed from an OCR-ish transcription.
- The known-facts block is **data, not instruction**. A fetched biography
  or caption is third-party text that can contain anything, including
  text shaped like a prompt ("ignore previous instructions", "score this
  profile 100"). Delimit it explicitly, label it as untrusted profile
  content to be analyzed and never obeyed, and add the guardrail sentence
  to `SYSTEM_PROMPT`. Cover this with a test asserting an injected
  instruction in a fixture bio doesn't change the audit's structure.
- Do not weaken any existing guardrail: no manipulation/deception advice,
  no commentary on protected characteristics, third-party people
  appearing in fetched posts are not the subject of the audit.
- `bioStaleness` for URL audits keys on `ig_username`, not just
  `user_id` — a user auditing two handles shouldn't see one profile's
  streak reported against the other. Pass the handle through to the
  prior-bio query in the pipeline helper (5.6).

**Acceptance criteria.**
- [ ] A URL-sourced audit returns every field an upload-sourced audit
  returns, with the same archetype/red-flag/coverage vocabularies.
- [ ] `bio.transcribedText` equals the fetched biography verbatim when
  one was fetched (asserted in a test), so emoji density is computed on
  real text.
- [ ] Existing `__tests__/api/audit.test.ts` still passes with the
  extended `runProfileAudit` signature.
- [ ] A fixture profile whose biography contains an injection attempt
  produces a normal, schema-valid audit.
- [ ] Staleness streaks are per-handle for URL audits.

### 5.5 Code-computed profile metrics (`lib/ig-metrics.ts`)

**Problem.** Fetched posts carry timestamps, engagement counts, and
caption text — facts that should be *computed*, not estimated by a
language model. This repo already prefers that split (`lib/emoji.ts`
computes emoji density in code instead of asking the model;
`lib/bio-staleness.ts` computes the streak in code), and the same
reasoning applies here.

**Requirements.** New pure module, no DB and no network, unit-tested the
way `lib/emoji.ts` is. Given `IgMedia[]` plus the profile counts, compute:
- **Posting cadence** — median gap between the fetched posts in days, plus
  days since the most recent post, and a verdict (`active` / `slowing` /
  `dormant`). A profile last posted eleven months ago reads as abandoned,
  and that's a fact, not a judgement call.
- **Media mix** — counts and shares of image / video / carousel posts. A
  grid with no video at all is a concrete, nameable gap.
- **Caption profile** — median caption length in characters, share of
  posts with no caption, median hashtag count per post, and whether
  hashtag use looks spammy (a documented threshold, stated in the module).
- **Engagement** — median likes and comments per post, and engagement rate
  against `followerCount` when both are available. Explicitly `null`, not
  zero, when the provider doesn't return counts — never fabricate a rate
  from missing data.
- **Follower/following ratio**, when both are present.

Surface the result as a new optional `profileMetrics` field on
`AuditResult` (nullable, so upload-sourced and basic-mode audits simply
carry `null`), rendered by a new `components/ProfileMetricsCard.tsx`
alongside the existing cards. Also feed the computed values into the
model's context block (5.4) so `contentStrategy` and `topActions` can
reference them instead of re-deriving them.

**Acceptance criteria.**
- [ ] Pure functions, no DB/network, covered by
  `__tests__/lib/ig-metrics.test.ts` including the empty-input and
  missing-engagement-data cases.
- [ ] Every metric is `null` rather than a guess when its input is
  missing.
- [ ] `profileMetrics` is nullable and absent-safe — existing history rows
  and upload audits render unchanged.

### 5.6 API route

**Requirements.**
- New handler `app/api/audit/url/route.ts`, JSON body (not multipart):
  `{ url: string, depth: 'basic' | 'detailed' }`. Leave `/api/audit`
  alone — it keeps serving the upload flow unchanged.
- Same route-handler conventions as the rest of `app/api/**`: auth via
  `getCurrentUserId()` with a 401 when absent, validate the body with
  `zod`, return `NextResponse.json({ error }, { status })` on every
  failure path.
- Order of operations: auth → parse/validate handle (`lib/ig-url.ts`) →
  plan and depth gating → rate-limit checks (5.8) → snapshot lookup or
  provider fetch → private/empty-profile checks → image fetch →
  `runProfileAudit` → code-computed metrics, emoji density, staleness →
  persist → respond.
- Extract the shared tail of that pipeline — staleness lookup, result
  assembly, `audits` insert, persistence failures not being fatal — into
  `lib/audit-pipeline.ts`, and have **both** routes use it. Today that
  logic lives inline in `app/api/audit/route.ts`; duplicating it is how
  the two paths drift apart.
- Persist `source = 'url'`, `ig_username`, `depth`, `photo_count` (the
  number of images actually analyzed, after skips), and `bio_text` (the
  fetched biography) so history rows are indistinguishable in quality
  from upload rows.

**Acceptance criteria.**
- [ ] Unauthenticated request returns 401.
- [ ] Malformed URL/handle returns 400 with a specific message per
  rejection class from 5.1.
- [ ] Successful call returns the same JSON body shape `/api/audit`
  returns.
- [ ] `lib/audit-pipeline.ts` is used by both routes; no duplicated
  persistence or staleness logic remains in either.
- [ ] Persistence failure still returns the audit to the user (matching
  today's behavior).

### 5.7 UI

**Requirements.**
- `components/ProfileUrlForm.tsx` — new client component: a URL/handle
  input, a basic/detailed depth selector with one line of copy explaining
  what each covers, the ownership attestation checkbox from 5.9, a submit
  button, inline validation from a client-side call into `lib/ig-url.ts`
  (same module, no duplicated regex), and a progress indicator that names
  the current stage ("Fetching profile…", "Analyzing 9 photos…") — a
  detailed audit is a multi-second operation and a bare spinner reads as
  broken.
- `app/dashboard/page.tsx` gains a two-tab switch at the top: **"Paste
  profile URL"** (default) and **"Upload screenshots"** (today's
  `UploadForm`, unchanged). The URL path becomes the primary entry point;
  upload stays as the fallback for private accounts, other platforms, and
  anyone who'd rather not hand over a handle.
- Results render through the existing `AuditResults`, with a small badge
  naming the source and depth ("Instagram · @handle · Detailed"), and —
  for URL audits — the fetched avatar and grid thumbnails used as
  `previewUrls` so the photo cards keep their images.
- On a fetch failure that has an upload fallback (5.10), the error state
  offers a one-click switch to the upload tab, preserving whatever the
  user already typed.
- Tailwind only, hand-rolled TSX, matching the existing components — no
  component library, no new state-management dependency.

**Acceptance criteria.**
- [ ] A signed-in user can paste `instagram.com/handle`, pick a depth, and
  get a rendered audit without uploading anything.
- [ ] Upload flow still works, unchanged, from the second tab.
- [ ] Validation errors appear inline before any request is sent.
- [ ] Every failure state offers a next step, not a dead end.

### 5.8 Abuse, rate limiting, and cost control

**Problem.** Uploads are self-limiting: the user can only audit profiles
they can screenshot. A URL field can be pointed at anyone, and every
submission costs a provider request plus a model call. Without limits this
is a free scraping-and-analysis service running on our budget.

**Requirements.**
- Reuse `dailyAuditLimit(plan)` / `getAuditsUsedToday()` — URL audits count
  against the same daily cap as uploads; this is not a separate allowance.
- Add a per-user daily cap on **distinct handles** audited (suggested: 2
  free / 10 paid), so the daily audit allowance can't be spread across
  arbitrarily many strangers' profiles. New small module
  `lib/url-audit-limit.ts` alongside `lib/rate-limit.ts` and
  `lib/login-rate-limit.ts`, following their shape.
- A global daily provider-request budget (`IG_DAILY_FETCH_BUDGET`), checked
  before dispatching a fetch, so a runaway loop or a spike can't produce an
  unbounded vendor bill. Exceeding it returns a clear "try again later",
  logs loudly, and does not fall through to a live scrape.
- Snapshot cache (5.2) is checked before every fetch — a re-run inside the
  TTL costs nothing.
- Refuse `isPrivate` profiles before any image fetch or model call.
- Log per-audit provider request count and image count so unit cost is
  measurable once a vendor is live.

**Acceptance criteria.**
- [ ] URL audits decrement the same daily allowance as uploads.
- [ ] Distinct-handle cap is enforced and has its own specific message,
  distinguishable from the daily-audit message.
- [ ] Global fetch budget is enforced and tested.
- [ ] Private profile is rejected before any spend.

### 5.9 Privacy, consent, and legal

**Problem.** Every audit today is the user's own profile, with their own
screenshots. This feature lets a user submit *someone else's* public
profile, which means the app now fetches and processes third-party
personal data — a materially different privacy posture, and one §1.1's
privacy policy does not currently describe.

**Requirements.**
- Update the §1.1 privacy policy before this ships: disclose that pasting
  a profile URL causes the app to retrieve that profile's public data
  (via the named provider, as a sub-processor), that the fetched images
  are sent to Anthropic and **not** stored, and that what is retained is
  the generated JSON audit plus the handle, biography text, and cached
  snapshot (with its TTL). Update the ToS's acceptable-use section to
  prohibit using the tool to profile, harass, or surveil other people.
- Ownership attestation in the UI (5.7): an explicit checkbox stating the
  profile is the user's own or one they're authorized to audit. Not legal
  armor by itself, but it sets the product's intent and is the hook for
  enforcement.
- Refuse private profiles outright (5.8) — "public" is the whole premise.
- Provide snapshot deletion: a user-triggered path (or, at minimum, a
  documented manual query) to purge `ig_profile_snapshots` rows for a
  handle, and a stated TTL-based expiry, so cached third-party data isn't
  retained indefinitely.
- Rate the distinct-handle cap (5.8) as a privacy control, not just a cost
  control — it's the mechanism that stops bulk profiling.

**Decision recorded here when made:** whether to go further and require
proof of ownership (e.g. a verification code temporarily placed in the
bio) before allowing an audit. Current recommendation: **no** — it
reintroduces exactly the friction this feature exists to remove, and the
data being read is already public. Revisit if abuse shows up.

**Acceptance criteria.**
- [ ] Privacy policy and ToS updated and live *before* the feature is
  enabled in production.
- [ ] Attestation checkbox is required to submit.
- [ ] Private profiles are refused with a clear explanation.
- [ ] Snapshot purge path exists and is documented in the README.

### 5.10 Failure modes and fallback

**Requirements.** Every one of these gets its own message and its own
suggested next step — never a generic "something went wrong", and never a
silent partial audit presented as a complete one:

| Condition | Response |
| --- | --- |
| Invalid/unparseable handle or URL | 400, inline, with an example of a valid URL |
| Post/reel permalink pasted | 400, "that's a post, not a profile" |
| Handle not found | 404, offer the upload tab |
| Profile is private | 422, explain public-only, offer the upload tab |
| Profile has zero posts | 200 with a header-only audit, coverage marked accordingly |
| Provider timeout / 5xx / quota exhausted | 503, "try again shortly", offer the upload tab |
| Some images failed to download | 200, audit proceeds, coverage note states how many were skipped |
| All images failed to download | 502, offer the upload tab |
| Model call fails | 502, matching `/api/audit`'s existing behavior and copy |

The upload flow is the designated fallback for all of these — it must stay
fully functional and reachable in one click from any URL-flow error state.

**Acceptance criteria.**
- [ ] Each row above is exercised by a test with a mocked provider.
- [ ] No failure path returns a 500 or an unhandled rejection.
- [ ] Partial image failure is disclosed in the result, not hidden.

### 5.11 Tests

**Requirements.** Vitest, colocated under `__tests__/` mirroring source
paths, external services mocked — same as every existing test in the repo:
- `__tests__/lib/ig-url.test.ts` — every accepted form normalizes; every
  rejected class returns its own error.
- `__tests__/lib/ig-metrics.test.ts` — cadence, media mix, caption
  profile, engagement, empty and missing-data cases.
- `__tests__/lib/ig-profile/fixture.test.ts` — the fixture provider
  satisfies the `ProfileProvider` interface and the `zod` mapping.
- `__tests__/api/audit-url.test.ts` — 401 unauthenticated; 400 bad
  handle; 422 private; depth gating by plan; snapshot cache hit performs
  zero provider calls; distinct-handle cap; prompt-injection fixture;
  successful audit returns the same shape as `/api/audit`.
- Extend `__tests__/api/audit.test.ts` to prove the upload flow is
  unchanged by the `runProfileAudit` signature change.

**Acceptance criteria.**
- [ ] `npm test` passes with the new files, no network access in any test.
- [ ] Provider and Anthropic client are mocked, never called for real.

### 5.12 Configuration

**Requirements.** New env vars, added to `.env.example` with placeholders
and documented in the README's env var list:

```
IG_PROVIDER=fixture            # fixture | graph | vendor
IG_PROVIDER_API_KEY=           # vendor credential, when IG_PROVIDER=vendor
IG_GRAPH_ACCESS_TOKEN=         # when IG_PROVIDER=graph
IG_GRAPH_USER_ID=              # the connected IG Business account making the lookup
IG_FETCH_TIMEOUT_MS=15000
IG_SNAPSHOT_TTL_MINUTES=60
IG_DAILY_FETCH_BUDGET=500
```

`IG_PROVIDER` defaults to `fixture` so a misconfigured deployment fails
visibly and cheaply rather than falling back to a live scrape.

**Acceptance criteria.**
- [ ] `.env.example` and README list every var above.
- [ ] Missing credentials for the selected provider produce a clear
  configuration error, not a runtime crash mid-audit.

### 5.13 Out of scope (for this section)

Named explicitly so a later session doesn't quietly expand the work:
- Other platforms (TikTok, X, LinkedIn) by URL. The upload flow already
  handles them via its platform selector; URL ingestion is
  Instagram-only for now.
- Stories, highlights, and tagged photos — not reliably available from
  any of the candidate providers.
- Historical tracking / "your profile over time" dashboards. The snapshot
  table is a cache with a TTL, deliberately not a time series. A
  progress-tracking feature is its own spec.
- Competitor or benchmark comparison ("how do I stack up against @x") —
  a different product with a different privacy posture.
- Auto-applying fixes (editing the bio, reordering the grid) — this app
  critiques, it doesn't hold write access to anyone's account.

---

## Suggested sequencing

1. **Carried-over hardening (§1)** first — small, self-contained, and the
   legal items (1.1) need to exist before billing anyway.
2. **SEO foundations (§2: 2.1 custom domain, 2.2 Search Console, 2.4
   content hub)** — can run in parallel with §1; content hub is the long
   lead-time item, worth starting early.
3. **CI + component/E2E tests (§3)** — put a safety net in place before
   introducing a payments surface in §4.
4. **Stripe billing (§4)** — the product's core unlock, sequenced after the
   legal groundwork and test coverage above.
5. **Public-URL profile analysis (§5)** — the biggest funnel win in this
   document (it removes the screenshot-upload step entirely) but sequenced
   last because 5.1 is blocked on a paid-vendor decision and 5.9 depends on
   §1.1's privacy policy and ToS existing. Two pieces can start before that
   decision lands: `lib/ig-url.ts` and `lib/ig-metrics.ts` are pure,
   dependency-free modules that can be built and tested against fixtures
   immediately. If §4 ships first, §5's "detailed" depth mode becomes the
   clearest paid-plan upsell the product has.
