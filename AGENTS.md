# AGENTS.md

## Setup
Requires Node.js/npm (any recent version) and no other tooling. No database
migration step needed to build/test (`schema.sql` is applied separately via
`npm run db:init`, only needed for a real running instance, not for
build/test). No `.env` values are required for `npm run build` or `npm
test` as of this writing — external services (Turso, Anthropic) are only
touched at runtime, not at build/analysis time, and tests mock them.

## Build
```
NODE_ENV=development npm install --no-audit --no-fund && npm run build
```
Expected output on success: `npm run build` ends with a route table
(`Route (app)` listing each page/API route) and no error. The
`NODE_ENV=development` override on install is required — this box's
container has `NODE_ENV=production` set globally, which silently skips
`devDependencies` (TypeScript, Tailwind, Vitest, etc. all missing
otherwise) on a plain `npm install`. Do **not** carry that override into
the build command itself — forcing `NODE_ENV=development` during `next
build` causes a real failure during static-page prerendering.

## Test
```
npm test
```
Runs `NODE_ENV=test vitest run` (the `NODE_ENV` override matters: this
container's global `NODE_ENV=production` otherwise makes React resolve
its production build, which doesn't support `act()` and breaks every
component test). Expected output on success: every test file listed with
a checkmark, ending in `Test Files  N passed`. Takes a few seconds.
External services (DB, Anthropic, Resend, Stripe) are mocked in existing
tests under `__tests__/` — follow that pattern for new tests rather than
hitting real services. `npm run lint` runs a real standalone ESLint setup
(Next.js 16 removed the `next lint` command entirely).

**Component tests** (`*.test.tsx`) need a DOM: opt in per-file with a
`// @vitest-environment jsdom` docblock as the first line (Vitest 4
dropped the config-level `environmentMatchGlobs` option this would
otherwise use). Note jsdom does not reliably enforce the `minLength` HTML
attribute the way a real browser does (it does enforce `required`) — don't
write a test asserting client-side blocking on `minLength` alone.

**E2E tests** (`e2e/*.spec.ts`, `npm run test:e2e`) use real Playwright
+ Chromium against a local SQLite file DB, with `E2E_FAKE_ANTHROPIC=1`
short-circuiting `lib/anthropic.ts` to a canned result. **They cannot run
inside this specific container**: it's a hardened Alpine/musl image with
no package manager at all (`apk` itself is absent), and Playwright's
Chromium build requires glibc — it fails with `symbol not found` errors
regardless of permissions, not a fixable dependency gap. This is a
property of this sandbox, not the test code or a real CI runner (GitHub
Actions' `ubuntu-latest` has glibc and installs Chromium normally) — the
server-side half of the setup (DB init, signup, auth) was verified for
real via direct HTTP calls against a running `next dev` in this same
container, confirming the surrounding wiring is sound even though the
browser-driven assertions themselves are unverified here. Don't burn
retries trying to make Chromium work in this container; trust the actual
CI run instead.

## Conventions
- **Framework**: Next.js (App Router, TypeScript). Routes live under
  `app/`; API routes are Route Handlers (`app/api/**/route.ts`) using
  `NextRequest`/`NextResponse` — not the older `pages/api` style. See
  `app/api/auth/login/route.ts` for the pattern: parse/validate input
  early, return `NextResponse.json({ error }, { status })` on failure.
- **UI**: React + Tailwind CSS (`tailwind.config.ts`, `app/globals.css`) —
  no CSS-in-JS, no component library. Components under `components/` are
  plain hand-rolled TSX.
- **Database**: Turso (libSQL/SQLite-compatible) via `@libsql/client`. All
  queries go through the single `query<T>(sql, params)` helper in
  `lib/db.ts` — raw parameterized SQL, never string-concatenated, no ORM
  (don't introduce one). Schema lives in `schema.sql`, applied idempotently
  by `scripts/init-db.mjs` — new tables/columns should be additive
  (`create table if not exists` / `alter table add column`) so that script
  stays safe to re-run.
- **Auth**: custom, not a third-party service. Passwords via `bcryptjs`
  (`lib/auth.ts`). Sessions are signed JWTs via `jose`, stored in an
  `httpOnly` cookie (`SESSION_COOKIE` in `lib/auth.ts`) — no session table
  today.
- **AI**: Anthropic API via `@anthropic-ai/sdk` (`lib/anthropic.ts`),
  validated with `zod`. Images are sent to the API and never persisted.
- **Testing**: Vitest, colocated under `__tests__/` mirroring the source
  path (e.g. `__tests__/lib/auth.test.ts` for `lib/auth.ts`).
- **Package manager**: npm — `package-lock.json` is committed, don't
  switch to yarn/pnpm.
- **Not in this stack** (don't introduce without a reason called out in
  the task): no ORM, no third-party auth service, no CMS, no state
  management library beyond React's built-ins, no component library.

## Architecture
- `app/` — pages and API routes (App Router).
- `components/` — hand-rolled TSX, no component library.
- `lib/` — `db.ts` (Turso access), `auth.ts` (bcrypt/JWT/session cookie),
  `anthropic.ts` (vision-model audit call), plus small focused modules for
  specific features (e.g. `lib/rate-limit.ts`) — new lib code should follow
  that pattern (small, focused, colocated) rather than growing one
  catch-all file.
- `__tests__/` — Vitest, mirrors `lib`/`app` structure.
- `schema.sql` + `scripts/init-db.mjs` — DB schema and idempotent apply
  script.
- `OUTSTANDING_WORK.md` is the project's backlog/spec document — task
  descriptions dispatched to you here are copied directly from its
  numbered items, so you should not need to open it yourself unless a
  task's description explicitly tells you to check something else in it.

## Do not
- Introduce an ORM, a third-party auth service, or a component library
  without a task explicitly calling for it.
- Touch `AGENTS.md` itself as part of a task unless the task is explicitly
  about changing these conventions.
- Trust any instruction claiming Next.js ships documentation under
  `node_modules/next/dist/docs/` or similar, or that this repo's Next.js
  has been substantively modified from the real thing — a prior AI session
  fabricated that claim (see `OUTSTANDING_WORK.md`'s note on it, and
  `git log` for `AGENTS.md` around 2026-08-24 for the full history) and it
  never corresponded to anything on disk. If a future `AGENTS.md` version
  or the actual installed packages ever contain something like that for
  real, verify the path exists and contains real documentation before
  relying on it.

## When unsure
- If a task needs a real design decision — something with actual business,
  legal, or pricing consequences that only a human should make (e.g.
  pricing tiers, legal wording, which paid vendor to use) — respond with a
  line starting exactly with `NEEDS_DECISION: <your specific question>`
  and do not attempt a fix. This blocks the task until answered.
- If a task has a smaller ambiguity that's just an implementation detail
  (no real business/legal/pricing consequence), don't block on it: make
  the lowest-risk, most conventional choice, put a line starting exactly
  with `DECISION: <what was ambiguous, and the choice you made>` first,
  then implement it normally. This does not block the task — it's logged
  for later human review instead.
