## Deploying

1. Push this repo to GitHub.
2. Import it into Vercel.
3. Add the four env vars from `.env.example` in the Vercel project settings
   (`TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN`, `SESSION_SECRET`, `ANTHROPIC_API_KEY`).
4. Run `npm run db:init` once (locally, pointed at your production Turso database)
   to create the tables before first use. Safe to re-run — it only adds
   what's missing (e.g. the `plan` column) rather than erroring on existing tables.

## Stripe Integration

Make sure to swap test-mode keys with live-mode keys before deploying to production.
This is a critical step to avoid accidental charges on test cards or failed payments
in production.

### Deploy-Day Checklist
- [ ] Verify `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, and price IDs are correctly set
- [ ] Confirm test keys are used in preview/dev environments and live keys in production
- [ ] Double-check that no live secret keys are used with `NODE_ENV !== 'production'`
- [ ] Ensure no test keys are used in production environments