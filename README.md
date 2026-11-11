# LearnHub - Premium Learning Platform

Production-focused Next.js App Router platform with Supabase authentication/data/storage and Stripe subscriptions.

## Stack

- Next.js 16 (App Router, TypeScript)
- Supabase (Auth, Postgres, Storage)
- supabase-js on the server (service role) for data access, with RLS for anything the browser reads
- Stripe (Checkout, Billing Portal, Webhooks)
- Tailwind CSS + shadcn-style UI primitives
- React Query + Zustand

## Quick Start

1. Install dependencies:

```bash
npm install
```

2. Configure environment variables:

```bash
cp .env.example .env.local   # then fill it in
```

3. Set up Supabase schema by running [supabase/schema.sql](supabase/schema.sql).

4. Start development server:

```bash
npm run dev
```

## Stripe Tiers

- Insider: $29/month
- Core: $79/month
- Pro: $199/month

Set price IDs in `.env.local`:

- `STRIPE_PRICE_INSIDER`
- `STRIPE_PRICE_CORE`
- `STRIPE_PRICE_PRO`

## API Endpoints

- `POST /api/stripe/checkout`
- `POST /api/stripe/portal`
- `POST /api/stripe/webhook`
- `POST /api/progress`
- `GET|POST /api/notes`
- `GET /api/media/[mediaId]/download`
- `GET /api/media/[mediaId]/stream`
- `GET /api/admin/users`
- `POST /api/admin/grant-access`
- `POST /api/admin/revoke-access`
- `GET /api/admin/analytics`
- `POST /api/admin/bulk-actions`
- `GET|POST|DELETE /api/admin/roles`
- `GET /api/admin/audit-logs`

`GET /api/admin/users` supports pagination and filters:

- `page`
- `pageSize`
- `search`
- `tier`
- `status`
- `role` (admin|member)

## Deploy to Vercel

1. Push repository to GitHub.
2. Import project in Vercel.
3. Add all environment variables from `.env.example`.
4. Configure Stripe webhook to:
   - `https://yourdomain.com/api/stripe/webhook`
5. Test in Stripe test mode and then switch keys to production.

## Security Notes

- Stripe webhooks are verified with `STRIPE_WEBHOOK_SECRET`.
- Protected routes are enforced in middleware.
- Supabase RLS policies are included for user-owned records.
- RBAC is database-driven via `roles` and `user_roles` tables.
- Admin actions are audit logged in `admin_audit_logs`.
- Admin roles can be managed from the Admin dashboard and /admin/roles screen.
- Stripe remains source of truth for subscription state.

## Demo on the shared Supabase hub

The `demo` branch runs LearnHub inside the `learnhub` schema of a shared
Supabase project, with sample data and Stripe switched off.

1. Run [supabase/hub/schema.sql](supabase/hub/schema.sql) in the SQL editor and add
   `learnhub` to Project Settings → Data API → Exposed schemas.
2. Build the demo media (narrated lesson videos, PDFs, audio, EPUB) into
   `scripts/.media/`: `DEEPGRAM_API_KEY=… PLAYWRIGHT_CORE=… CHROME=… node scripts/make-media.mjs`.
3. Seed (also resets the demo): `SUPABASE_URL=… SUPABASE_SERVICE_ROLE_KEY=… npm run seed:hub`.
4. Set `NEXT_PUBLIC_SUPABASE_DB_SCHEMA=learnhub`, `SUPABASE_MEDIA_BUCKET=learnhub-media` and
   `NEXT_PUBLIC_DEMO_MODE=true` alongside the Supabase URL and keys.

In demo mode, choosing a plan switches it on without a card, and the billing
page shows the plan instead of opening Stripe. The demo admin
(`app_metadata.no_delete`) can change plans and roles of the sample learners
only, and can't remove admin roles or unpublish courses.

## Testing Checklist

- Signup/login and email verification
- Tier-based access checks (Insider/Core/Pro)
- Checkout -> webhook subscription sync
- Failed payment -> `past_due` transition
- Course progress persistence
- Protected media streaming and downloads
