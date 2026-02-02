# User Subscription Pricing

## Pricing Structure

### Free Tier
- **Price**: $0/month
- **Features**:
  - Daily Focus check-ins
  - Basic task tracking
  - Community support
- **Access**: Focus tab only
- **Restrictions**: No AI Coach, no Awareness tracking, no premium content

### Premium Tier
- **Price**: $19.99/month (fixed)
- **Features**:
  - Everything in Free
  - AI Coach conversations (unlimited)
  - Awareness tracking & insights
  - Premium content library
  - Advanced analytics
- **Access**: All tabs and features

## Revenue Split

For Premium subscriptions ($19.99/month):
- **Platform takes**: $7.00/month (35%)
- **Coach receives**: $12.99/month (65%)

## Signup Flows

### 1. Free Signup
- User clicks "Start Free" on landing page
- Creates account with email/password
- Redirected to dashboard with free access
- Can upgrade anytime from Settings

### 2. Premium Signup
- User clicks "Start Premium" on landing page
- Creates account with email/password
- Redirected to Stripe checkout ($19.99/month)
- After payment, full premium access

### 3. Upgrade from Free
- Free user goes to Settings
- Clicks "Upgrade to Premium"
- Redirected to Stripe checkout ($19.99/month)
- Instant access after payment

## Implementation Details

### Database
- All coaches have `user_monthly_price_cents = 1999`
- New users created with `token_limit = 0` (free tier)
- Premium users get `token_limit` increased via webhook after successful subscription

### Stripe Checkout
- Fixed pricing: $19.99/month
- Platform fee: 35% ($7)
- Uses Stripe Connect to split payments
- If coach has connected account: automatic transfer
- If coach hasn't connected: funds held until connection

### API Endpoints

**Create Checkout**:
```
POST /api/stripe/user-checkout
```

**Check Subscription Status**:
```
GET /api/user/subscription-status
Returns: { isPremium: boolean, subscription: {...} }
```

**Cancel Subscription**:
```
POST /api/user/cancel-subscription
```

### Webhooks
- `checkout.session.completed`: Activate premium access
- `customer.subscription.updated`: Update subscription status
- `customer.subscription.deleted`: Revert to free tier

## UI/UX

### Landing Page
- Shows both Free and Premium pricing cards
- Premium card highlighted with border and "PREMIUM" badge
- Clear feature comparison
- Separate signup buttons for each tier

### User Dashboard
- Free users see yellow dots on locked tabs (Awareness, Coach)
- Clicking locked tabs shows upgrade modal
- Blurred overlay prevents interaction
- "Upgrade to Premium" button in Settings

### Settings Page
- Shows current plan (Free or Premium)
- Displays price ($0 or $19.99/month)
- Upgrade button for free users
- Cancel button for premium users

## Security

### Frontend
- Locked tabs have disabled buttons and inputs
- Visual overlays prevent interaction
- Yellow dots indicate premium features

### Backend
- Chat API checks subscription status, returns 403 for free users
- Awareness API checks subscription status, returns 403 for free users
- Token limit enforced (0 for free users)
- All premium features protected at API level

## Testing

### Test Free User
```bash
./manage-user.sh testuser@example.com free
```

### Test Premium User
```bash
./manage-user.sh testuser@example.com premium
```

### Test Upgrade Flow
1. Sign up as free user on landing page
2. Verify Focus tab works
3. Try to access Awareness/Coach tabs → blocked
4. Go to Settings → Click "Upgrade to Premium"
5. Complete Stripe checkout (test mode: 4242 4242 4242 4242)
6. Verify all tabs now accessible

## Coach Payouts

- Coaches receive $12.99 per premium subscriber per month
- Must connect Stripe account to receive payouts
- Payout schedule follows Stripe's default (2-day rolling)
- Can view payout history in Stripe Express dashboard

## Coupon Support

- Coupons can be applied at checkout
- Use Stripe Dashboard to create coupons
- Examples:
  - 50% off first month
  - Free trial for 14 days
  - $5 off monthly
