# Coach Subscription Setup Guide

## Overview

Coaches subscribe with:
- **$500 one-time setup fee** (waivable with coupon)
- **$50/month recurring subscription** (first month waivable with coupon)

## Step 1: Run Database Migration

Run the migration to add required database fields:

```bash
# In Supabase SQL Editor, run:
```

```sql
-- migrations/add_coach_subscription_fields.sql
ALTER TABLE coaches 
ADD COLUMN IF NOT EXISTS setup_fee_paid BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS setup_fee_paid_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS setup_fee_amount_cents INTEGER,
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
ADD COLUMN IF NOT EXISTS platform_subscription_price_id TEXT;

-- Add platform setting for Stripe price IDs
INSERT INTO platform_settings (key, value) VALUES 
  ('coach_setup_fee_price_id', '""'::jsonb),
  ('coach_monthly_subscription_price_id', '""'::jsonb)
ON CONFLICT (key) DO NOTHING;
```

## Step 2: Configure Stripe Products

### A. Create Setup Fee Product

1. Go to **Stripe Dashboard** → **Products** → **Add product**
2. Configure:
   - **Name**: `Daily Companion Coach - Setup Fee`
   - **Description**: `One-time setup fee for coaches`
   - **Pricing**: 
     - **One time**
     - **Price**: `$500.00 USD`
   - Click **Save product**
3. **Copy the Price ID** (looks like `price_xxxxxxxxxxxxx`)

### B. Create Monthly Subscription Product

1. **Add another product**
2. Configure:
   - **Name**: `Daily Companion Coach - Monthly Plan`
   - **Description**: `Monthly subscription for coaches to access the platform`
   - **Pricing**:
     - **Recurring**
     - **Billing period**: `Monthly`
     - **Price**: `$50.00 USD`
   - Click **Save product**
3. **Copy the Price ID** (looks like `price_yyyyyyyyyyyyy`)

## Step 3: Update Supabase Platform Settings

Update the platform settings with your Stripe Price IDs:

```sql
-- Update with your actual Stripe Price IDs
UPDATE platform_settings 
SET value = '"price_xxxxxxxxxxxxx"'::jsonb 
WHERE key = 'coach_setup_fee_price_id';

UPDATE platform_settings 
SET value = '"price_yyyyyyyyyyyyy"'::jsonb 
WHERE key = 'coach_monthly_subscription_price_id';
```

Replace `price_xxxxxxxxxxxxx` and `price_yyyyyyyyyyyyy` with your actual Price IDs from Stripe.

## Step 4: Create Coupons in Stripe

### Coupon 1: Free Setup Fee

1. Go to **Stripe Dashboard** → **Coupons** → **Create coupon**
2. Configure:
   - **Type**: `Amount off`
   - **Amount**: `$500.00 USD`
   - **Name**: `Free Setup Fee`
   - **Coupon ID**: `FREE_SETUP` (for easy reference)
   - **Duration**: `Once`
   - **Applies to**: Select the **Setup Fee product** only
   - **Max redemptions**: (optional - leave blank or set a limit)
3. Click **Create coupon**

### Coupon 2: Free First Month

1. **Create another coupon**
2. Configure:
   - **Type**: `Amount off`
   - **Amount**: `$50.00 USD`
   - **Name**: `Free First Month`
   - **Coupon ID**: `FREE_FIRST_MONTH`
   - **Duration**: `Once`
   - **Applies to**: Select the **Monthly Plan product** only
   - **Max redemptions**: (optional)
3. Click **Create coupon**

### Coupon 3: Both Free (Optional)

If you want a coupon that waives both fees:

1. **Create another coupon**
2. Configure:
   - **Type**: `Amount off`
   - **Amount**: `$550.00 USD` (covers both)
   - **Name**: `Promotional - Free Trial`
   - **Coupon ID**: `PROMO_FREE`
   - **Duration**: `Once`
3. Click **Create coupon**

## Step 5: Set Up Stripe Webhook

### Configure Webhook Endpoint

1. Go to **Stripe Dashboard** → **Developers** → **Webhooks**
2. Click **Add endpoint**
3. Configure:
   - **Endpoint URL**: `https://yourdomain.com/api/stripe/webhook`
   - **Description**: `Daily Companion Platform Webhooks`
   - **Events to send**: Select these events:
     - `checkout.session.completed`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
     - `account.updated` (for Stripe Connect)
4. Click **Add endpoint**
5. **Copy the Signing Secret** (looks like `whsec_xxxxx`)

### Add to Environment Variables

```env
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxxx
```

## Step 6: Test the Flow

### Test with Real Stripe Dashboard

1. Coach signs up → creates account
2. Coach clicks "Subscribe" → redirects to Stripe Checkout
3. Checkout shows:
   - **Setup Fee**: $500.00 (one-time)
   - **Monthly Plan**: $50.00/month (recurring)
   - **Total today**: $550.00
4. Coach enters coupon code `FREE_SETUP` → Setup fee removed
5. Coach completes payment
6. Webhook fires → Database updated:
   - `platform_subscription_status` = `'active'`
   - `platform_subscription_id` = Stripe subscription ID
   - `stripe_customer_id` = Stripe customer ID
   - `setup_fee_paid` = `true`
   - `setup_fee_paid_at` = timestamp
   - `is_active` = `true`

### Test Subscription Cancellation

1. Go to **Stripe Dashboard** → **Subscriptions**
2. Find the coach's subscription
3. Click **Cancel subscription**
4. Webhook fires → Database updated:
   - `platform_subscription_status` = `'canceled'`
   - `is_active` = `false`

## How It Works

### Initial Subscription Flow

1. **Coach clicks "Subscribe"**
   - Frontend calls: `POST /api/stripe/coach-checkout`
   - Backend checks if setup fee already paid
   - Creates Stripe Checkout session with:
     - Monthly subscription (recurring)
     - Setup fee (if not already paid)

2. **Coach pays in Stripe Checkout**
   - Stripe creates subscription
   - Fires `checkout.session.completed` webhook
   - Backend updates coach record

3. **Coach can now use platform**
   - `is_active` = `true`
   - Can access dashboard, upload content, etc.

### Subsequent Subscriptions (if coach re-subscribes)

If a coach cancels and later re-subscribes:
- Setup fee is NOT charged again (already paid)
- Only the $50/month recurring fee applies

### Subscription Updates

When Stripe updates subscription status (past_due, canceled, etc.):
- `customer.subscription.updated` webhook fires
- Backend updates coach status accordingly
- `is_active` flag reflects current subscription state

### Cancellation

When coach cancels via Stripe Dashboard:
- `customer.subscription.deleted` webhook fires
- Backend sets:
  - `platform_subscription_status` = `'canceled'`
  - `is_active` = `false`
- Coach loses access to platform features

## Environment Variables Needed

```env
# Stripe Keys
STRIPE_SECRET_KEY=sk_live_...           # or sk_test_ for testing
STRIPE_PUBLISHABLE_KEY=pk_live_...      # or pk_test_ for testing
STRIPE_WEBHOOK_SECRET=whsec_...

# App URL
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

## Important Notes

1. **Coupons are applied at checkout** - Coaches enter coupon codes in the Stripe Checkout UI
2. **Setup fee is one-time** - Once paid, it's never charged again for that coach
3. **Webhooks are critical** - Ensure webhook endpoint is working before going live
4. **Test mode** - Use Stripe test mode keys for testing, switch to live keys for production
5. **Customer Portal** - Coaches can manage subscriptions via Stripe Customer Portal (implement separately if needed)

## Troubleshooting

### Webhook not firing?

1. Check webhook signing secret matches `.env`
2. Check webhook endpoint is publicly accessible
3. View webhook logs in Stripe Dashboard → Developers → Webhooks → [your endpoint]

### Setup fee charged twice?

Check `setup_fee_paid` field in database - should be `true` after first payment

### Subscription not activating?

1. Check webhook logs for errors
2. Verify `platform_subscription_id` is stored correctly
3. Check Stripe Dashboard → Subscriptions for subscription status

## Next Steps

After coach subscription is working:
1. Add subscription status checks to protected routes
2. Display subscription status in coach dashboard
3. Add "Manage Billing" link (Stripe Customer Portal)
4. Implement grace period for failed payments
5. Send email notifications for subscription events
