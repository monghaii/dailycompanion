# Coach Subscription - Quick Setup Steps

## 🚀 Quick Start (Do these in order)

### 1. Run Database Migration

```sql
-- Copy and paste this into Supabase SQL Editor
ALTER TABLE coaches 
ADD COLUMN IF NOT EXISTS setup_fee_paid BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS setup_fee_paid_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS setup_fee_amount_cents INTEGER,
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
ADD COLUMN IF NOT EXISTS platform_subscription_price_id TEXT;

INSERT INTO platform_settings (key, value) VALUES 
  ('coach_setup_fee_price_id', '""'::jsonb),
  ('coach_monthly_subscription_price_id', '""'::jsonb)
ON CONFLICT (key) DO NOTHING;
```

### 2. Create Stripe Products & Get Price IDs

**Product 1: Setup Fee**
- Name: `Daily Companion Coach - Setup Fee`
- Type: One-time
- Price: $500.00
- Copy Price ID: `price_xxxxxxxxxxxxx`

**Product 2: Monthly Plan**
- Name: `Daily Companion Coach - Monthly Plan`  
- Type: Recurring (monthly)
- Price: $50.00/month
- Copy Price ID: `price_yyyyyyyyyyyyy`

### 3. Update Platform Settings with Price IDs

```sql
-- Replace price_xxxxx with your actual Price IDs from Stripe
UPDATE platform_settings 
SET value = '"price_xxxxxxxxxxxxx"'::jsonb 
WHERE key = 'coach_setup_fee_price_id';

UPDATE platform_settings 
SET value = '"price_yyyyyyyyyyyyy"'::jsonb 
WHERE key = 'coach_monthly_subscription_price_id';
```

### 4. Create Coupons in Stripe Dashboard

**Coupon 1: FREE_SETUP**
- Type: Amount off
- Amount: $500.00 USD
- Duration: Once
- Applies to: Setup Fee product only

**Coupon 2: FREE_FIRST_MONTH**
- Type: Amount off
- Amount: $50.00 USD
- Duration: Once
- Applies to: Monthly Plan product only

### 5. Configure Webhook

**Stripe Dashboard → Developers → Webhooks → Add endpoint**
- URL: `https://yourdomain.com/api/stripe/webhook`
- Events:
  - ✓ checkout.session.completed
  - ✓ customer.subscription.updated
  - ✓ customer.subscription.deleted
  - ✓ account.updated
- Copy signing secret: `whsec_xxxxx`
- Add to `.env`: `STRIPE_WEBHOOK_SECRET=whsec_xxxxx`

## ✅ You're Done!

**What happens now:**
1. Coach signs up → clicks Subscribe
2. Stripe Checkout shows: $500 setup + $50/month = $550 first payment
3. Coach can enter coupon codes (FREE_SETUP or FREE_FIRST_MONTH)
4. After payment, webhook activates coach account
5. Monthly billing continues at $50/month
6. If coach cancels in Stripe → webhook deactivates account

**To give someone free access:**
- Give them coupon code `FREE_SETUP` (waives $500)
- Give them coupon code `FREE_FIRST_MONTH` (waives first $50)
- They enter codes at Stripe Checkout

## 🧪 Testing

**Test Mode:**
1. Use test keys: `sk_test_...` and `pk_test_...`
2. Use test card: `4242 4242 4242 4242`
3. Any future date, any CVC

**Check it worked:**
```sql
-- View coach subscription status
SELECT 
  business_name,
  platform_subscription_status,
  setup_fee_paid,
  is_active
FROM coaches 
WHERE id = 'coach-id-here';
```
