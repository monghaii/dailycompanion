# Dev Mode: Bypass Stripe for Testing

## Overview

To test user signup flow via coach landing pages without requiring live Stripe integration, you can enable dev mode bypassing.

## Setup

Add the following to your `.env` file:

```bash
DEV_BYPASS_STRIPE=true
```

## What It Does

When `DEV_BYPASS_STRIPE=true` is set:

1. **Skips Stripe Validation**: The signup flow skips checks for:
   - Coach having a Stripe account ID
   - Coach being active
   - Coach having an active platform subscription

2. **Creates Mock Subscription**: Instead of creating a Stripe checkout session:
   - Creates a user account with the coach assignment
   - Creates a mock subscription record in `user_subscriptions` table
   - Uses test IDs: `dev_sub_XXXXXXXX` and `dev_cus_XXXXXXXX`
   - Sets subscription status to `active`
   - Sets period end to 1 month (monthly plan) or 12 months (yearly plan) from now

3. **Auto-Login**: Automatically logs the user in and redirects to dashboard

## Testing Flow

1. Set `DEV_BYPASS_STRIPE=true` in your `.env` file
2. Restart your Next.js dev server
3. Visit a coach landing page: `http://localhost:3000/coach/{coach-slug}`
4. Click "Get Started" or "Start Your Journey"
5. Fill out the signup form
6. Click "Continue to Payment"
7. **Instead of going to Stripe**, you'll be:
   - Created as a user
   - Assigned to the coach
   - Given an active subscription
   - Logged in automatically
   - Redirected to `/user/dashboard?subscription=success&welcome=true`

## Production

**Important**: Make sure to remove or set `DEV_BYPASS_STRIPE=false` in production environments.

The production Stripe flow will work normally when this env variable is:
- Not set
- Set to `false`
- Set to any value other than `true`

## Database Records Created in Dev Mode

### Profile
```sql
INSERT INTO profiles (id, email, full_name, role, coach_id)
VALUES (uuid, email, 'First Last', 'user', coach_id);
```

### User Subscription
```sql
INSERT INTO user_subscriptions (
  user_id, 
  coach_id, 
  stripe_subscription_id, 
  stripe_customer_id,
  status,
  current_period_start,
  current_period_end
)
VALUES (
  user_id,
  coach_id,
  'dev_sub_XXXXXXXX',
  'dev_cus_XXXXXXXX',
  'active',
  NOW(),
  NOW() + INTERVAL '1 month' -- or '12 months' for yearly
);
```

### Session
```sql
INSERT INTO sessions (user_id, token, expires_at)
VALUES (user_id, jwt_token, NOW() + INTERVAL '7 days');
```

## Notes

- Dev subscriptions are identifiable by their `stripe_subscription_id` starting with `dev_sub_`
- Dev customers are identifiable by their `stripe_customer_id` starting with `dev_cus_`
- These can be cleaned up manually from the database if needed
- The auth cookie will be set automatically for login
