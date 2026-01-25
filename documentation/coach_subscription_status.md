# Coach Subscription - Configuration Complete ✅

## Your Stripe Configuration

### Price IDs
- **Setup Fee (one-time)**: `price_1StHMtIKp421Myt9JASq47Me` ($500)
- **Monthly Recurring**: `price_1StHNlIKp421Myt9xYd6zymA` ($50/month)

### Coupons (Apply manually at checkout)
- **Free Setup**: `mHWf8LLj` - Waives $500 setup fee
- **Free Month**: `fo1NIOxI` - Waives first $50

## ✅ Completed Steps

- [x] Database migration run
- [x] Stripe products created
- [x] Stripe coupons created
- [ ] Platform settings updated (run `update_stripe_price_ids.sql`)
- [ ] Webhook configured in Stripe Dashboard
- [ ] Test subscription flow

## Next: Update Platform Settings

Run this in Supabase SQL Editor:

```sql
UPDATE platform_settings 
SET value = '"price_1StHMtIKp421Myt9JASq47Me"'::jsonb 
WHERE key = 'coach_setup_fee_price_id';

UPDATE platform_settings 
SET value = '"price_1StHNlIKp421Myt9xYd6zymA"'::jsonb 
WHERE key = 'coach_monthly_subscription_price_id';
```

## Webhook Configuration

**Important:** Configure webhook in Stripe Dashboard

1. Go to: **Stripe Dashboard** → **Developers** → **Webhooks**
2. Click **Add endpoint**
3. **Endpoint URL**: `https://dailycompanion.app/api/stripe/webhook`
   - ⚠️ Replace with your actual domain
4. **Events to send**:
   - ✓ `checkout.session.completed`
   - ✓ `customer.subscription.updated`
   - ✓ `customer.subscription.deleted`
   - ✓ `account.updated`
5. Copy the **Signing Secret** (starts with `whsec_`)
6. Add to your environment variables:
   ```env
   STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
   ```

## Testing the Flow

### Test in Stripe Test Mode

1. **Make sure you're using test keys**:
   ```env
   STRIPE_SECRET_KEY=sk_test_...
   STRIPE_PUBLISHABLE_KEY=pk_test_...
   ```

2. **Create a test coach account** or use existing
3. **Trigger subscription**: Click "Subscribe" button
4. **Expected Stripe Checkout**:
   - Setup Fee: $500.00 (one-time)
   - Monthly Plan: $50.00/month
   - **Total today**: $550.00
5. **Test coupons**:
   - Enter `mHWf8LLj` → Setup fee removed (total: $50)
   - Enter `fo1NIOxI` → First month removed (total: $500)
6. **Use test card**: `4242 4242 4242 4242`, any future date, any CVC
7. **Complete payment**
8. **Verify webhook fired** (check Stripe Dashboard → Developers → Webhooks)
9. **Check database**:
   ```sql
   SELECT 
     business_name,
     platform_subscription_status,
     platform_subscription_id,
     setup_fee_paid,
     stripe_customer_id,
     is_active
   FROM coaches 
   WHERE profile_id = 'your-profile-id';
   ```
   
   Should show:
   - `platform_subscription_status` = `'active'`
   - `setup_fee_paid` = `true`
   - `is_active` = `true`
   - `stripe_customer_id` = populated

### Test Cancellation

1. Go to **Stripe Dashboard** → **Customers** → find your test customer
2. Go to **Subscriptions** → Click on subscription
3. Click **Cancel subscription**
4. Confirm cancellation
5. **Check database**:
   ```sql
   SELECT 
     business_name,
     platform_subscription_status,
     is_active
   FROM coaches 
   WHERE profile_id = 'your-profile-id';
   ```
   
   Should show:
   - `platform_subscription_status` = `'canceled'`
   - `is_active` = `false`

## Go Live Checklist

When ready for production:

1. Switch to live Stripe keys:
   ```env
   STRIPE_SECRET_KEY=sk_live_...
   STRIPE_PUBLISHABLE_KEY=pk_live_...
   ```
2. Configure webhook with live endpoint
3. Update `STRIPE_WEBHOOK_SECRET` with live webhook secret
4. Create live versions of coupons (if needed)
5. Test with real payment

## Troubleshooting

**Webhook not firing?**
- Check webhook URL is correct and publicly accessible
- Verify `STRIPE_WEBHOOK_SECRET` matches Stripe Dashboard
- Check webhook logs in Stripe Dashboard

**Subscription not activating?**
- Check server logs for webhook errors
- Verify Price IDs are correct in platform_settings
- Check `platform_subscription_id` is being stored

**Setup fee charged twice?**
- Check `setup_fee_paid` field - should be `true` after first payment

## Summary

✅ **Coach subscription is ready!**

**What happens:**
1. Coach clicks Subscribe → $550 charged ($500 setup + $50 first month)
2. Webhook activates account
3. Monthly billing continues at $50/month
4. Setup fee never charged again
5. Coupons can be applied manually at checkout

**Next:** Configure webhook, test the flow, then you're done! 🎉
