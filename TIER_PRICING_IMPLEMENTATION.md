# 3-Tier Pricing System Implementation

## Overview

Implemented a 3-tier subscription system for Daily Companion with custom coach pricing for Tier 3 and exclusive Resource Hub access.

## Pricing Structure

### Tier 1: Free (Basic)

- **Price:** $0/month
- **Access:** Daily practices only
- **Features:** Basic functionality

### Tier 2: Premium

- **Price:** $19.99/month (hardcoded, coaches cannot change)
- **Yearly:** $219.89/year (1 month free - pay for 11 months, get 12)
- **Platform Fee:** $5.00 flat
- **Coach Revenue:** $14.99/month
- **Access:** Full access to all features except Resource Hub

### Tier 3: Premium Plus

- **Price:** Coach-set (minimum $49.99/month, uses `user_monthly_price_cents` field)
- **Yearly:** 11 months price (1 month free)
- **Platform Fee:** 20% of price OR $5.00, whichever is higher
- **Coach Revenue:** (Tier 3 Price - Platform Fee)
- **Examples:**
  - At $49.99: Platform fee = $10 (20%), Coach gets $39.99
  - At $99.99: Platform fee = $20 (20%), Coach gets $79.99
  - At $25.00: Platform fee = $5 (minimum), Coach gets $20.00
- **Access:** Premium features + exclusive Resource Hub access
- **Badge:** "ELITE" badge displayed

## Database Changes

### Migration: `add_subscription_tier_tracking`

Added to `user_subscriptions` table:

- `subscription_tier` (INTEGER, default 2): Tier level (2 or 3)
- `billing_interval` (TEXT, default 'monthly'): 'monthly' or 'yearly'
- `price_cents` (INTEGER): Actual price paid (for historical record)

## Key Features

### For Coaches (Finance Tab)

1. **Tier 2 Display (Fixed)**
   - Monthly: $19.99/month
   - Yearly: $219.89/year (1 month free)
   - Revenue: $14.99/month
   - Cannot be changed by coaches

2. **Tier 3 Pricing (Custom)**
   - Input field to set monthly price (minimum $49.99)
   - Automatic calculation of yearly price (11 months)
   - Display of coach revenue after $5 platform fee
   - Save button to update pricing

### For End Users (Settings/Subscription)

1. **3-Tier Display**
   - Basic (Free) - with downgrade button if premium
   - Premium ($19.99) - with upgrade/downgrade buttons
   - Premium Plus (coach-set price) - with "ELITE" badge and upgrade button

2. **Yearly Billing Info**
   - Info banner explaining 1-month-free yearly discount
   - Applied automatically during checkout

3. **Resource Hub Access**
   - Locked for Tier 1 and Tier 2 users
   - Only accessible to Tier 3 subscribers
   - Locked overlay with blur effect for non-Tier-3 users
   - Upgrade modal prompts to Tier 3 when clicked

### Checkout Flow

1. Users can select tier (2 or 3) and interval (monthly or yearly)
2. Stripe checkout created with appropriate pricing
3. Tier and interval saved in subscription record
4. Webhook updates subscription with tier metadata

## Files Modified

### Database

- `migrations/add_subscription_tier_tracking.sql` - New migration

### Backend

- `src/lib/stripe.js` - Updated `createUserSubscriptionCheckout()` to handle tiers
- `src/app/api/stripe/user-checkout/route.js` - Added tier/interval parameters
- `src/app/api/stripe/webhook/route.js` - Save tier metadata on subscription
- `src/app/api/user/subscription-status/route.js` - Return tier information

### Frontend - Coach Dashboard

- `src/app/dashboard/page.js` - Updated Finance tab with tier pricing display

### Frontend - User Dashboard

- `src/app/user/dashboard/page.js`:
  - Added 3-tier subscription display
  - Added `handleChangeTier()` function
  - Updated Resource Hub access control
  - Added tier-specific upgrade modal messaging
  - Added yearly billing info banner

### Frontend - Landing Page

- `src/app/coach/[coachSlug]/page.js`:
  - Updated pricing section to display all 3 tiers
  - Added "POPULAR" badge to Tier 2
  - Added "ELITE" badge to Tier 3
  - Tier 3 shows coach-set price from database
  - Added yearly savings info banner
  - Updated grid layout to fit 3 pricing cards

### Frontend - Signup

- `src/app/signup/page.js`:
  - Added tier parameter extraction from URL
  - Pass tier to checkout API
  - Display tier badge when signing up for premium
  - Show "Premium Plus (Elite)" badge for Tier 3 signups

## Testing Checklist

### Coach Side

- [ ] Finance tab shows both Tier 2 (fixed) and Tier 3 (editable) pricing
- [ ] Tier 3 price can be updated (min $19.99)
- [ ] Revenue calculations are correct ($price - $5)
- [ ] Yearly prices show 11 months cost

### User Side

- [ ] All 3 tiers display correctly in Settings
- [ ] Tier 2 checkout works (monthly)
- [ ] Tier 2 checkout works (yearly with discount)
- [ ] Tier 3 checkout works (monthly)
- [ ] Tier 3 checkout works (yearly with discount)
- [ ] Resource Hub is locked for Tier 1 users
- [ ] Resource Hub is locked for Tier 2 users
- [ ] Resource Hub is accessible for Tier 3 users
- [ ] Upgrade modal for Resource Hub prompts to Tier 3
- [ ] Downgrade from Tier 3 to Tier 2 works
- [ ] Downgrade from Tier 2 to Tier 1 (cancel) works
- [ ] Upgrade from Tier 2 to Tier 3 works

### Stripe Webhook

- [ ] Tier metadata saved on subscription creation
- [ ] Billing interval saved correctly
- [ ] Price_cents saved correctly

## Revenue Model

**Platform Revenue Per User:**

- Tier 2: $5/month fixed
- Tier 3: 20% of price OR $5/month, whichever is higher

**Coach Revenue Per User:**

- Tier 2: $14.99/month fixed
- Tier 3: (Coach Price - Platform Fee)/month
  - At $49.99: Coach gets $39.99 (Platform gets $10)
  - At $99.99: Coach gets $79.99 (Platform gets $20)
  - At $199.99: Coach gets $159.99 (Platform gets $40)

## Notes

1. Existing subscriptions will default to Tier 2 for backward compatibility
2. Test accounts (`is_test_premium`) automatically get Tier 3 access
3. Coaches can view but not change Tier 2 pricing (platform controls this in database)
4. Yearly discount is automatically applied - users select interval during checkout
5. Minimum Tier 3 price is $49.99 (encourages premium positioning)
6. Resource Hub is the ONLY feature exclusive to Tier 3
7. All other premium features are available to both Tier 2 and Tier 3
8. **Platform fee structure:**
   - Tier 2: Flat $5 fee (25% of $19.99)
   - Tier 3: Dynamic 20% fee with $5 minimum (scales with coach pricing)
   - This incentivizes coaches to price Tier 3 appropriately while ensuring minimum platform revenue

## Future Enhancements

- Allow yearly billing selection in UI (currently defaults to monthly)
- Add analytics for tier conversion rates
- Add ability to create custom tiers per coach
- Add granular feature access control per tier
