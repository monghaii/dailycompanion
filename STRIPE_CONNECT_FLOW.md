# Stripe Connect Flow for Coach Payouts

This document explains how coaches connect their bank accounts to receive payouts from user subscriptions.

## Overview

Coaches must connect a Stripe Express account to receive payments when users subscribe to their coaching services. The platform automatically splits payments, taking a platform fee and sending the remainder to the coach's connected account.

## Flow for Coach WITHOUT Existing Stripe Account

### 1. Coach Initiates Connection
- Coach clicks "Connect with Stripe" button on Finance tab in dashboard
- Button is disabled until coach has an active platform subscription
- Frontend calls `POST /api/stripe/connect`

### 2. Backend Creates Stripe Account
```javascript
// /api/stripe/connect/route.js
- Checks if coach already has stripe_account_id in database
- If not, creates new Stripe Express account via stripe.accounts.create()
- Saves stripe_account_id to coaches table
- Generates onboarding link via stripe.accountLinks.create()
- Returns onboarding URL
```

### 3. Stripe Onboarding
- Coach is redirected to Stripe's onboarding flow
- Coach provides:
  - Business information
  - Bank account details
  - Identity verification documents
  - Tax information

### 4. Return to Platform
- **Success**: Stripe redirects to `/dashboard?connect=complete`
- **Expired Link**: Stripe redirects to `/dashboard?connect=refresh`

### 5. Status Check
- Frontend detects `?connect=complete` query parameter
- Calls `GET /api/stripe/account-status` to verify account is active
- Shows success message
- Refreshes user data to update UI

### 6. Webhook Updates
- Stripe fires `account.updated` webhook when account status changes
- Webhook handler updates `stripe_account_status` in database:
  - `active`: charges_enabled && payouts_enabled
  - `pending`: not yet fully verified

## Flow for Coach WITH Existing Stripe Account

### 1. Coach Initiates Connection
- Coach clicks "Connect with Stripe" button
- Button shows "Connecting..." loading state
- Frontend calls `POST /api/stripe/connect`

### 2. Backend Uses Existing Account
```javascript
// /api/stripe/connect/route.js
- Finds existing stripe_account_id in database
- Generates new onboarding link using existing account
- Returns onboarding URL
```

### 3-6. Same as Above
- Coach completes any pending requirements
- Returns to platform
- Status verified
- Webhook updates status

## Accessing Stripe Dashboard (Already Connected)

For coaches with active Stripe accounts:

### Button Displayed
- "View Stripe Dashboard →" button replaces "Connect with Stripe"
- Shown when `stripe_account_status === 'active'`

### Click Handler
```javascript
- Calls POST /api/stripe/dashboard-link
- Backend creates temporary login link via stripe.accounts.createLoginLink()
- Opens Stripe Express dashboard in new tab
- No password required - secure single-use link
```

## API Endpoints

### POST /api/stripe/connect
Creates or retrieves Stripe Connect account and returns onboarding link.

**Auth Required**: Yes (Coach only)

**Response**:
```json
{
  "url": "https://connect.stripe.com/setup/s/..."
}
```

### GET /api/stripe/account-status
Checks current status of coach's Stripe Connect account with Stripe API.

**Auth Required**: Yes (Coach only)

**Response**:
```json
{
  "connected": true,
  "status": "active",
  "chargesEnabled": true,
  "payoutsEnabled": true,
  "detailsSubmitted": true
}
```

### POST /api/stripe/dashboard-link
Generates secure login link to Stripe Express dashboard.

**Auth Required**: Yes (Coach with active Stripe account)

**Response**:
```json
{
  "url": "https://connect.stripe.com/express/..."
}
```

## Database Fields

### coaches table
- `stripe_account_id`: Stripe Connect account ID (e.g., `acct_xxxx`)
- `stripe_account_status`: `'pending'` | `'active'` | `null`

## Webhook Events

### account.updated
```javascript
{
  type: 'account.updated',
  data: {
    object: {
      id: 'acct_xxxx',
      charges_enabled: true,
      payouts_enabled: true,
      metadata: {
        coachId: 'coach-uuid'
      }
    }
  }
}
```

**Handler Updates**:
- Sets `stripe_account_status` to `'active'` if both charges and payouts enabled
- Sets `stripe_account_status` to `'pending'` otherwise

## User Subscription Flow (After Coach Connected)

When a user subscribes to a coach's service:

1. **Checkout Session Created** (`/api/stripe/user-checkout`)
   ```javascript
   {
     subscription_data: {
       application_fee_percent: 20, // Platform takes 20% or $2, whichever greater
       transfer_data: {
         destination: coach.stripe_account_id // Only if account active
       }
     }
   }
   ```

2. **Automatic Payment Split**
   - Stripe charges user's card
   - Platform fee (20% or $2 min) held in platform account
   - Remaining amount automatically transferred to coach's connected account
   - Coach receives payout according to their Stripe payout schedule (typically 2-day rolling)

3. **If Coach Not Connected**
   - User can still subscribe
   - Payment collected to platform account
   - Funds held until coach connects Stripe account
   - Once connected, future payments automatically split
   - Past payments remain in platform account (manual payout required)

## Error Handling

### Coach Not Subscribed to Platform
- "Connect with Stripe" button is disabled
- Shows message: "Subscribe to the platform first to enable payouts"

### Onboarding Link Expired
- Stripe redirects to `/dashboard?connect=refresh`
- Coach sees: "Session expired. Please try connecting again."
- Coach can click button again to get new link

### Account Pending Verification
- Status shown as "pending verification"
- Coach can re-enter onboarding flow to complete requirements
- Webhook updates status when verification complete

## Testing

### Test Mode
1. Set `STRIPE_SECRET_KEY` to test key (starts with `sk_test_`)
2. Use Stripe test bank account numbers:
   - Routing: `110000000`
   - Account: `000123456789`
3. Use test SSN: `000-00-0000`
4. Skip identity verification in test mode

### Webhooks in Development
```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

Use the webhook signing secret from CLI output in `.env`:
```
STRIPE_WEBHOOK_SECRET=whsec_xxxxx
```

## Security Notes

- All API routes check user authentication and role
- Stripe account IDs stored in database, not accessible to users
- Login links are single-use and expire quickly
- Platform never has access to coach's bank account details
- All transfers happen automatically through Stripe - no manual handling

## Support

If a coach has issues connecting:
1. Check their `stripe_account_status` in database
2. Look for webhook events in Stripe dashboard
3. Verify `stripe_account_id` exists and is valid
4. Check if account has restrictions in Stripe dashboard
5. Generate new onboarding link by clicking "Connect with Stripe" again
