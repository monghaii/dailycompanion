# User Subscription Implementation Status

## ✅ COMPLETED

### 1. Database Schema
- ✅ Migration created: `migrations/add_user_subscription_pricing.sql`
- ✅ Platform fee settings configured (20% or $2, whichever is greater)
- ✅ User pricing fields already exist in coaches table

### 2. Coach Dashboard
- ✅ Pricing configuration already exists (Profile section)
- ✅ Coaches can set `user_monthly_price_cents` for their subscribers

### 3. Stripe Connect
- ✅ Button already working in Finance tab
- ✅ `/api/stripe/connect` endpoint fully implemented
- ✅ Creates Connect account and onboarding link

### 4. User Subscription Checkout
- ✅ `/api/stripe/user-checkout` endpoint exists and updated
- ✅ Platform fee logic implemented: max($2, 20% of price)
- ✅ Allows subscriptions even if coach hasn't connected Stripe yet
- ✅ Funds held until coach connects (no transfer_data if not connected)
- ✅ Supports coupon codes via `allow_promotion_codes: true`

### 5. Webhooks
- ✅ Already handle user subscriptions in `checkout.session.completed`
- ✅ Handle subscription updates in `customer.subscription.updated`
- ✅ Handle cancellations in `customer.subscription.deleted`
- ✅ Platform fee tracked in metadata

## 🚧 REMAINING TASKS

### 6. User Dashboard - Subscription Section
**Location**: `/src/app/user/dashboard/page.js` (lines 4935-5208)

**Needs:**
- Fetch user's actual subscription status from database
- Show FREE vs PREMIUM based on real data
- If FREE: Show "Upgrade to Premium" button
- If PREMIUM: Show current price, next billing date, cancel button
- Wire up "Upgrade" button to call `/api/stripe/user-checkout`
- Wire up "Cancel Subscription" button

**Current State**: Static mockup with hardcoded plans

### 7. Cancellation Flow
**Needs:**
- Create `/api/user/cancel-subscription` endpoint
- Call Stripe to cancel subscription
- Update `user_subscriptions` table
- User keeps access until period end

### 8. User Management Script
**Needs:**
- Bash script like `manage-coach.sh`
- Commands: `list`, `promote <email>`, `demote <email>`, `status <email>`
- Directly updates `user_subscriptions` table for testing

## IMPLEMENTATION DETAILS

### Platform Fee Calculation
```javascript
const minFeeCents = 200; // $2
const percentageFee = Math.round(price * 0.20); // 20%
const platformFee = Math.max(minFeeCents, percentageFee);
```

### Examples
| Coach Price | Platform Fee | Coach Gets |
|-------------|--------------|------------|
| $5/mo       | $2.00        | $3.00      |
| $10/mo      | $2.00        | $8.00      |
| $15/mo      | $3.00        | $12.00     |
| $29/mo      | $5.80        | $23.20     |
| $50/mo      | $10.00       | $40.00     |

## NEXT STEPS

Run the migration:
```sql
-- In Supabase SQL Editor
\i migrations/add_user_subscription_pricing.sql
```

Then implement remaining tasks 6, 7, and 8.

## QUESTIONS RESOLVED

1. ✅ Price changes only affect new users (not existing)
2. ✅ Platform fee: $2 or 20%, whichever is greater
3. ✅ Users can subscribe even if coach hasn't connected Stripe
4. ✅ Funds held until coach connects
5. ✅ Free month = manual coupon only
6. ✅ Users can self-cancel, keep access until period end
