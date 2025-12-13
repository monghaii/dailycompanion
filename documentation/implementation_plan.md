# Daily Companion - Implementation Plan

This is dailycompanion, a "patreon clone" for online coaches.

## Platform Overview

- A platform where coaches can sign up to create a coach account
- Coaches pay $50/month or $500/year to use the platform
- Coaches have a dashboard to upload content and customize their UI
- End users can subscribe to coaches at prices set by the coach
- Platform takes 20% fee (configurable in DB), rest goes to coach via Stripe Connect

## Phase 1 Scope (Implemented)

- [x] Supabase auth system
- [x] Coach signup/login
- [x] User signup/login (separate pages)
- [x] Basic coach dashboard UI with setup steps
- [x] Main site homepage (for coaches)
- [x] User dashboard (placeholder)
- [x] Stripe integration for coach subscriptions
- [x] Stripe Connect for user subscriptions to coaches
- [x] Coach landing pages (/coach/[slug])

## Architecture

- All DB/Stripe operations via API routes (Next.js Route Handlers)
- RLS enabled with no policies (service role key bypasses RLS)
- No frontend env access to sensitive keys

## Database Schema

See `documentation/schema.sql` for full SQL schema.

### Tables:

- `platform_settings` - Configurable settings (fees, prices)
- `profiles` - User profiles (extends auth.users)
- `coaches` - Coach data (slug, pricing, Stripe Connect info)
- `user_subscriptions` - User-to-coach subscriptions
- `sessions` - Auth sessions

## Environment Variables Required

```env
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Stripe
STRIPE_SECRET_KEY=sk_live_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_... (optional for local dev)

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
JWT_SECRET=your-random-secret-for-jwt-signing
```

## URLs / Routes

### Public Pages

- `/` - Homepage (marketing for coaches)
- `/coach/signup` - Coach registration
- `/coach/login` - Coach login
- `/signup` - User registration (optional ?coach=slug param)
- `/login` - User login (optional ?coach=slug param)
- `/coach/[slug]` - Coach landing page

### Protected Pages

- `/dashboard` - Coach dashboard
- `/user/dashboard` - User dashboard

### API Routes

- `POST /api/auth/signup` - Register user/coach
- `POST /api/auth/login` - Sign in
- `POST /api/auth/logout` - Sign out
- `GET /api/auth/me` - Get current user
- `GET /api/coach/[slug]` - Get public coach info
- `POST /api/stripe/coach-checkout` - Coach subscription checkout
- `POST /api/stripe/connect` - Stripe Connect onboarding
- `POST /api/stripe/user-checkout` - User subscription checkout
- `POST /api/stripe/webhook` - Stripe webhooks

## Setup Instructions

1. **Run the SQL schema in Supabase:**

   - Go to Supabase Dashboard → SQL Editor
   - Copy contents of `documentation/schema.sql`
   - Run the query

2. **Set up environment variables:**

   - Copy the env vars above to `.env.local`
   - Generate a random JWT_SECRET (e.g., `openssl rand -base64 32`)
   - Set NEXT_PUBLIC_APP_URL to your domain

3. **Enable Stripe Connect:**

   - Go to Stripe Dashboard → Settings → Connect
   - Enable Connect
   - Set up webhook endpoint for `/api/stripe/webhook`

4. **Run the app:**
   ```bash
   npm run dev
   ```

## Pricing Configuration

### Coach Pricing (Platform)

- Monthly: $50 (5000 cents)
- Yearly: $500 (50000 cents)
- Stored in `platform_settings` table

### User Pricing (Per Coach)

- Default: $29.99/month (2999 cents)
- Coaches can set custom pricing
- Platform fee: 20% (configurable)

## Next Steps (Phase 2)

- [ ] Content management for coaches (upload videos, articles)
- [ ] Coach page customization (colors, logo, bio)
- [ ] User content feed
- [ ] Subdomain support (coachname.dailycompanion.com)
- [ ] Email notifications
- [ ] Analytics dashboard
