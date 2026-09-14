# Deploying

1. Push this repo to GitHub.
2. Import it into Vercel.
3. Add the four env vars from `.env.example` in the Vercel project settings
   (`TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN`, `SESSION_SECRET`, `ANTHROPIC_API_KEY`).
4. Run `npm run db:init` once (locally, pointed at your production Turso database)
   to create the tables before first use. Safe to re-run — it only adds
   what's missing (e.g. the `plan` column) rather than erroring on existing tables.

## Testing Stripe webhooks locally

To test Stripe webhooks locally, use the following commands:

1. Start the development server:
   ```bash
   npm run dev
   ```

2. In a separate terminal, run:
   ```bash
   stripe listen --forward-to localhost:3000/api/webhooks/stripe
   ```

3. To trigger specific events, use:
   ```bash
   stripe trigger checkout.session.completed
   stripe trigger customer.subscription.created
   stripe trigger customer.subscription.updated
   stripe trigger customer.subscription.deleted
   ```

Make sure to replace `<event-name>` with the actual event type you want to test. This allows you to develop and manually verify webhook logic without deploying or waiting for real card transactions.

## Stripe Integration

Make sure to swap test-mode keys with live-mode keys before deploying to production.
This is a critical step to avoid accidental charges on test cards or failed payments
in production.

### Deploy-Day Checklist
- [ ] Verify `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, and price IDs are correctly set
- [ ] Confirm test keys are used in preview/dev environments and live keys in production
- [ ] Double-check that no live secret keys are used with `NODE_ENV !== 'production'`
- [ ] Ensure no test keys are used in production environments