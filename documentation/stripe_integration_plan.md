# Stripe Integration Plan - Daily Companion Coaching Platform

## Business Model Overview

### Revenue Streams

1. **Coach Subscriptions** (Platform Revenue)

   - One-time setup fee (paid to platform)
   - Recurring monthly fee (paid to platform)
   - Coaches need this to use the platform and onboard their users

2. **End-User Subscriptions** (Coach Revenue + Platform Commission)
   - End users subscribe to individual coaches
   - Payment goes through platform
   - Platform takes configurable percentage
   - Remaining amount goes to coach

---

## Recommended Stripe Architecture

### Stripe Products Required

1. **Stripe Connect** (Core requirement)

   - Type: **Standard Connect** or **Express Connect**
   - Allows coaches to receive payments while platform takes commission
   - Platform acts as the payment facilitator

2. **Stripe Subscriptions**

   - For coach monthly fees to platform
   - For end-user monthly/yearly subscriptions to coaches

3. **Stripe Checkout** (Optional but recommended)

   - Pre-built payment UI for better conversion
   - PCI compliance handled by Stripe

4. **Stripe Webhooks**
   - Listen for payment events
   - Update subscription statuses
   - Handle failures, cancellations, renewals

---

## Account Structure

```
┌─────────────────────────────────────────┐
│     Platform Stripe Account             │
│  (Your main Daily Companion account)    │
│                                          │
│  - Receives coach monthly fees           │
│  - Manages all Connected Accounts        │
│  - Facilitates end-user payments         │
│  - Takes platform commission             │
└─────────────────────────────────────────┘
                    │
                    │ manages
                    ↓
┌─────────────────────────────────────────┐
│   Coach 1 Connected Account              │
│   (Stripe Connect - Express)             │
│                                          │
│   - Receives user subscription payments  │
│   - Platform fee automatically deducted  │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│   Coach 2 Connected Account              │
│   (Stripe Connect - Express)             │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│   Coach N Connected Account              │
└─────────────────────────────────────────┘
```

---

## Payment Flows

### Flow 1: Coach Signs Up & Pays Setup Fee + Subscribes to Platform

```
1. Coach signs up on platform
   └─> Create profile in database
   └─> coach.setup_fee_paid = false
   └─> coach.is_active = false

2. Coach clicks "Complete Setup & Subscribe"
   └─> Redirect to Stripe Checkout
       - Mode: 'subscription'
       - Line Items:
         [
           {
             // One-time setup fee
             price_data: {
               currency: 'usd',
               product_data: { name: 'Platform Setup Fee' },
               unit_amount: setupFeeCents, // e.g., 10000 = $100
             },
             quantity: 1,
           },
           {
             // Recurring monthly subscription
             price: platform_monthly_price_id, // e.g., $50/month
             quantity: 1,
           }
         ]
       - Customer: coach_stripe_customer_id
       - Metadata: { coach_id, setup_fee: true }

3. Coach completes payment
   └─> Stripe charges:
       - Setup fee: $100 (one-time) → Platform keeps 100%
       - Monthly fee: $50 (recurring) → Platform keeps 100%

   └─> Stripe webhook fires: checkout.session.completed
       └─> Verify setup_fee payment line item exists
       └─> Update database:
           - coach.platform_subscription_status = 'active'
           - coach.setup_fee_paid = true
           - coach.setup_fee_paid_at = NOW()
           - Create payment_records entry for setup fee
       └─> Send welcome email to coach

4. Coach onboards (connects Stripe)
   └─> POST /api/stripe/connect
       - Verify coach.setup_fee_paid = true (gate this action)
       - Create Stripe Connected Account (Express)
       - Redirect coach to Stripe onboarding
       - Coach completes identity verification

5. Stripe webhook fires: account.updated
   └─> Update coach.stripe_account_id
   └─> Update coach.stripe_account_status = 'active'
   └─> Update coach.is_active = true

6. Coach can now accept user subscriptions
   └─> Check: coach.is_active && coach.setup_fee_paid && coach.stripe_account_id
```

**Setup Fee Configuration:**

```javascript
// In coach settings or platform config
const COACH_SETUP_FEE_CENTS = 10000; // $100 (configurable)
const COACH_MONTHLY_FEE_CENTS = 5000; // $50 (configurable)

// When creating Stripe Checkout for coach signup
const session = await stripe.checkout.sessions.create({
  mode: "subscription",
  customer: coachStripeCustomerId,
  line_items: [
    {
      // One-time setup fee
      price_data: {
        currency: "usd",
        product_data: {
          name: "Platform Setup Fee",
          description: "One-time fee to activate your coaching account",
        },
        unit_amount: COACH_SETUP_FEE_CENTS,
      },
      quantity: 1,
    },
    {
      // Recurring monthly subscription
      price: platformMonthlyPriceId, // Created in Stripe Dashboard
      quantity: 1,
    },
  ],
  success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard?setup=success`,
  cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard?setup=cancelled`,
  metadata: {
    coach_id: coach.id,
    includes_setup_fee: "true",
  },
});
```

**Important Notes:**

- Setup fee is charged ONCE at initial signup
- Monthly fee recurs automatically every month
- Coach cannot access full platform features until setup fee is paid
- Coach cannot onboard with Stripe Connect until setup fee is paid
- If coach cancels subscription later, setup fee is NOT refundable
- If coach re-activates later, they do NOT pay setup fee again

### Flow 2: End-User Subscribes to Coach

```
1. User visits coach's landing page
   └─> /coach/[coachSlug]

2. User clicks "Subscribe"
   └─> Redirect to Stripe Checkout
       - Customer: new or existing
       - Price: coach.user_monthly_price_cents
       - Connected Account: coach.stripe_account_id
       - Application Fee: (price × platform_fee_percentage)

3. User completes payment
   └─> Stripe webhook fires: checkout.session.completed
       └─> Create user_subscriptions record
           - user_id
           - coach_id
           - stripe_subscription_id
           - stripe_customer_id
           - status: 'active'

4. Automatic payment split happens:
   └─> User pays $29.99
       - Platform takes: $5.99 (20%)
       - Coach receives: $24.00 (80%)
```

### Flow 3: Subscription Renewal

```
1. Stripe automatically charges subscription
   └─> Every month on anniversary date

2. Stripe webhook fires: invoice.payment_succeeded
   └─> Update user_subscriptions.current_period_end

3. If payment fails:
   └─> Stripe webhook fires: invoice.payment_failed
       └─> Update user_subscriptions.status = 'past_due'
       └─> Send email to user
       └─> Restrict access after grace period
```

### Flow 4: User Cancels Subscription

```
1. User cancels subscription
   └─> Via Stripe Customer Portal or app UI
       - POST /api/stripe/cancel-subscription
       - stripe.subscriptions.update(subscriptionId, {
           cancel_at_period_end: true
         })

2. Stripe webhook fires: customer.subscription.updated
   └─> Update user_subscriptions record:
       - status = 'active' (still active until period ends)
       - canceled_at = current timestamp
       - will_renew = false

3. End of current billing period arrives
   └─> Stripe webhook fires: customer.subscription.deleted
       └─> Update user_subscriptions.status = 'canceled'
       └─> Revoke user access to coach's content

4. Financial settlement:
   └─> NO CLAWBACK NEEDED
       - User paid for full period
       - Coach keeps their share
       - Platform keeps commission
       - Access remains until period end (fair to user)

Note: This is the "friendly" cancellation where user completes
the billing period they paid for.
```

### Flow 5: Chargeback / Dispute

```
SCENARIO: User disputes charge with their bank after subscription

1. User files chargeback with bank
   └─> "I didn't authorize this charge"
   └─> "Service not as described"
   └─> "Fraudulent transaction"

2. Stripe webhook fires: charge.dispute.created
   └─> Stripe IMMEDIATELY debits platform account for:
       - Full charge amount ($29.99)
       - Dispute fee ($15)
       - Total: $44.99 withdrawn from platform

3. Platform must recover money from coach:
   └─> Stripe webhook handler logic:

   A. Identify the coach's Connected Account
      - Look up user_subscriptions by stripe_subscription_id
      - Get coach_id and coach.stripe_account_id

   B. Calculate amounts to recover:
      - Coach's portion: $24.00 (80% of $29.99)
      - Platform portion: $5.99 (already lost)
      - Dispute fee: $15.00 (platform eats this)

   C. Attempt to reverse the transfer:
      - stripe.transfers.createReversal(transferId, {
          amount: 2400, // cents - coach's portion only
        })

      ⚠️ LIMITATION: Reversals only work within 180 days of transfer

   D. If reversal succeeds:
      - Money recovered from coach's Stripe balance
      - Update dispute_status = 'recovered'
      - Log transaction

   E. If reversal fails (coach withdrew funds):
      - Coach's Stripe balance goes NEGATIVE
      - Stripe holds future payouts to coach
      - Coach must add funds to resolve negative balance

   F. Update database:
      - user_subscriptions.status = 'disputed'
      - Create dispute_record table entry:
        * user_id
        * coach_id
        * subscription_id
        * amount_disputed
        * platform_loss
        * recovery_status
        * dispute_reason

4. Coach is notified:
   └─> Email: "A user has disputed a charge"
   └─> Show in coach dashboard
   └─> Options:
       - Submit evidence to contest dispute
       - Accept the dispute
       - Future payouts may be held

5. Dispute resolution outcomes:

   CASE A: Platform wins dispute (user loses)
   └─> Stripe webhook fires: charge.dispute.closed (status: won)
       └─> Stripe refunds dispute fee to platform
       └─> Keep recovered funds
       └─> Restore coach's balance (re-transfer if reversed)
       └─> user_subscriptions.status = 'active' (restore access)

   CASE B: User wins dispute (platform loses)
   └─> Stripe webhook fires: charge.dispute.closed (status: lost)
       └─> Platform loses:
           - Full charge ($29.99)
           - Dispute fee ($15)
           - Total loss: $44.99
       └─> Coach's transfer reversal STANDS (coach loses their $24)
       └─> user_subscriptions.status = 'refunded'
       └─> Revoke user access immediately
       └─> Log as fraud if pattern detected

6. Fraud prevention triggers:
   └─> If coach has >3 disputes in 30 days:
       - Flag coach.status = 'under_review'
       - Hold future payouts for 7-14 days
       - Require manual review

   └─> If coach has >5% dispute rate:
       - Suspend new user signups
       - Stripe may restrict account
       - Platform may terminate coach
```

### Flow 6: Refund (Platform-Initiated)

```
SCENARIO: Coach or platform issues goodwill refund

1. Admin or coach initiates refund
   └─> POST /api/stripe/refund
       - Input: subscriptionId, amount (full or partial)

2. Create refund via Stripe API:
   └─> stripe.refunds.create({
         charge: chargeId,
         amount: 2999, // cents
         reverse_transfer: true, // KEY: Also reverse to coach
       })

3. Stripe automatically:
   └─> Refunds user's card
   └─> Reverses transfer to coach
   └─> Refunds application fee to platform

4. Stripe webhook fires: charge.refunded
   └─> Update user_subscriptions:
       - status = 'refunded'
       - refunded_at = timestamp
   └─> Revoke user access
   └─> Both coach and platform "undo" the payment

5. Financial outcome:
   └─> User gets: $29.99 back
   └─> Coach loses: $24.00 (reversed from balance)
   └─> Platform loses: $5.99 (commission reversed)
   └─> Stripe fees: NOT refunded (platform eats ~$1.17)

Note: This is cleaner than disputes because everyone agrees.
```

---

## Chargeback Protection Strategy

### 1. Preventive Measures

**A. Clear Billing Descriptors**

```javascript
// In Checkout Session
statement_descriptor: 'COACHING-DAILYCO',
statement_descriptor_suffix: coachName.substring(0, 10),
// Shows on card statement as: "COACHING-DAILYCO *BRAINPEACE"
```

**B. Detailed Service Description**

```javascript
// In Product/Price metadata
metadata: {
  coach_name: 'Brain Peace Coaching',
  service_type: 'Monthly Coaching Access',
  cancel_policy: 'Cancel anytime, access until period end',
}
```

**C. Email Receipts**

- Send detailed receipt immediately after payment
- Include:
  - What they purchased
  - Coach name
  - Billing period
  - How to cancel
  - Support contact

**D. Require Email Confirmation**

- Double opt-in for subscriptions
- "Confirm your subscription" email
- Reduces "I didn't sign up" disputes

### 2. Dispute Evidence Collection

When dispute occurs, auto-generate evidence:

```javascript
async function generateDisputeEvidence(subscriptionId) {
  const evidence = {
    // User's IP at signup
    customer_communication: emailReceiptUrl,
    customer_signature: "Agreed to Terms at signup",
    customer_name: user.full_name,
    customer_email_address: user.email,

    // Service delivery proof
    service_date: subscription.current_period_start,
    service_documentation: `User accessed platform ${loginCount} times`,

    // Cancellation policy
    cancellation_policy:
      "Users can cancel anytime. No refunds for partial periods.",

    // Terms of service
    terms_of_service_url: "https://dailycompanion.com/terms",
  };

  // Submit to Stripe
  await stripe.disputes.update(disputeId, { evidence });
}
```

### 3. Reserve Fund Strategy

**Option A: Hold Percentage of Coach Payouts**

```javascript
// When creating Connected Account payout schedule
{
  type: 'express',
  settings: {
    payouts: {
      schedule: {
        delay_days: 7, // Hold funds for 7 days
        interval: 'weekly',
      },
    },
  },
}
```

- Gives platform time to detect disputes before money leaves
- Coach gets paid weekly instead of daily
- Smoother for dispute recovery

**Option B: Negative Balance Handling**

```javascript
// In coach settings
{
  capabilities: {
    card_payments: { requested: true },
    transfers: { requested: true },
  },
  // Stripe will automatically hold future payouts if negative
}
```

**Option C: Platform Reserve Fund**

- Keep 2-5% of platform revenue in reserve
- Use to cover disputes while recovering from coaches
- Protects platform cash flow

### 4. Coach Contract Terms

Add to coach agreements:

```
"Coach agrees that in the event of user chargebacks or disputes,
the platform may:
1. Reverse transfers from coach's Stripe balance
2. Hold future payouts until dispute is resolved
3. Deduct dispute amounts from future earnings
4. Suspend coach account if dispute rate exceeds 3%
5. Terminate partnership if fraudulent activity is detected"
```

### 5. Automated Dispute Monitoring

```javascript
// Daily cron job or webhook aggregation
async function monitorCoachDisputeRates() {
  const coaches = await getCoachesWithDisputes();

  for (const coach of coaches) {
    const disputeRate = coach.disputes / coach.total_charges;

    if (disputeRate > 0.05) {
      // 5% threshold
      await flagCoachAccount(coach.id, "high_dispute_rate");
      await enablePayoutHold(coach.stripe_account_id, 14); // 14 day hold
      await sendCoachWarning(coach.id);
    }

    if (coach.disputes > 10 && disputeRate > 0.1) {
      // 10% threshold
      await suspendCoachAccount(coach.id);
      await notifyPlatformAdmin(coach.id);
    }
  }
}
```

---

## Database Schema Additions for Disputes

```sql
-- Add to existing tables

-- coaches table additions
ALTER TABLE coaches ADD COLUMN IF NOT EXISTS setup_fee_paid BOOLEAN DEFAULT false;
ALTER TABLE coaches ADD COLUMN IF NOT EXISTS setup_fee_paid_at TIMESTAMPTZ;
ALTER TABLE coaches ADD COLUMN IF NOT EXISTS setup_fee_amount_cents INTEGER;
ALTER TABLE coaches ADD COLUMN IF NOT EXISTS dispute_count INTEGER DEFAULT 0;
ALTER TABLE coaches ADD COLUMN IF NOT EXISTS total_charges INTEGER DEFAULT 0;
ALTER TABLE coaches ADD COLUMN IF NOT EXISTS payout_hold_until TIMESTAMPTZ;
ALTER TABLE coaches ADD COLUMN IF NOT EXISTS account_flags TEXT[];

-- user_subscriptions table additions
ALTER TABLE user_subscriptions ADD COLUMN IF NOT EXISTS refunded_at TIMESTAMPTZ;
ALTER TABLE user_subscriptions ADD COLUMN IF NOT EXISTS disputed_at TIMESTAMPTZ;
ALTER TABLE user_subscriptions ADD COLUMN IF NOT EXISTS dispute_status TEXT;
-- dispute_status: 'none', 'open', 'won', 'lost', 'recovered'

-- New table: dispute_records
CREATE TABLE IF NOT EXISTS dispute_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id),
  coach_id UUID REFERENCES coaches(id),
  subscription_id UUID REFERENCES user_subscriptions(id),

  stripe_dispute_id TEXT UNIQUE NOT NULL,
  stripe_charge_id TEXT NOT NULL,
  stripe_transfer_id TEXT, -- The transfer that was reversed

  amount_disputed INTEGER NOT NULL, -- cents
  amount_recovered INTEGER DEFAULT 0, -- cents
  dispute_fee INTEGER DEFAULT 1500, -- $15 in cents

  reason TEXT, -- 'fraudulent', 'unrecognized', 'product_not_received', etc.
  status TEXT NOT NULL, -- 'open', 'won', 'lost', 'recovered', 'unrecoverable'

  evidence_submitted_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,
  platform_loss INTEGER DEFAULT 0, -- Total platform loss in cents

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_dispute_records_coach ON dispute_records(coach_id);
CREATE INDEX idx_dispute_records_status ON dispute_records(status);
CREATE INDEX idx_dispute_records_user ON dispute_records(user_id);

-- New table: refund_records
CREATE TABLE IF NOT EXISTS refund_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id),
  coach_id UUID REFERENCES coaches(id),
  subscription_id UUID REFERENCES user_subscriptions(id),

  stripe_refund_id TEXT UNIQUE NOT NULL,
  stripe_charge_id TEXT NOT NULL,

  amount_refunded INTEGER NOT NULL, -- cents
  reason TEXT, -- 'requested_by_customer', 'duplicate', 'fraudulent', 'goodwill'
  initiated_by TEXT, -- 'user', 'coach', 'platform', 'admin'

  transfer_reversed BOOLEAN DEFAULT false,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_refund_records_coach ON refund_records(coach_id);
CREATE INDEX idx_refund_records_user ON refund_records(user_id);
```

---

## Webhook Handler Additions

```javascript
// Add to /src/app/api/stripe/webhook/route.js

case 'charge.dispute.created':
  await handleDisputeCreated(event.data.object);
  break;

case 'charge.dispute.closed':
  await handleDisputeClosed(event.data.object);
  break;

case 'charge.refunded':
  await handleChargeRefunded(event.data.object);
  break;

// Handler implementations

async function handleDisputeCreated(dispute) {
  const { charge, amount, reason, id: disputeId } = dispute;

  // Find the subscription
  const { data: payment } = await stripe.charges.retrieve(charge);
  const { data: subscription } = await supabase
    .from('user_subscriptions')
    .select('*, coaches(*)')
    .eq('stripe_charge_id', charge)
    .single();

  if (!subscription) {
    console.error('Subscription not found for dispute:', disputeId);
    return;
  }

  // Calculate amounts
  const coachPortion = Math.round(amount * 0.80); // 80% to coach
  const platformPortion = amount - coachPortion;

  // Attempt to reverse the transfer
  let recoveryStatus = 'pending';
  let amountRecovered = 0;

  try {
    const transfer = await findTransferForCharge(charge);

    if (transfer) {
      const reversal = await stripe.transfers.createReversal(transfer.id, {
        amount: coachPortion,
        description: `Dispute recovery for ${charge}`,
      });

      if (reversal.status === 'succeeded') {
        recoveryStatus = 'recovered';
        amountRecovered = coachPortion;
      }
    }
  } catch (error) {
    console.error('Transfer reversal failed:', error);
    recoveryStatus = 'failed';
    // Coach balance will go negative, Stripe holds future payouts
  }

  // Record the dispute
  await supabase.from('dispute_records').insert({
    user_id: subscription.user_id,
    coach_id: subscription.coach_id,
    subscription_id: subscription.id,
    stripe_dispute_id: disputeId,
    stripe_charge_id: charge,
    amount_disputed: amount,
    amount_recovered: amountRecovered,
    reason,
    status: 'open',
    platform_loss: amount + 1500, // Include $15 dispute fee
  });

  // Update subscription status
  await supabase
    .from('user_subscriptions')
    .update({
      status: 'disputed',
      disputed_at: new Date().toISOString(),
      dispute_status: 'open',
    })
    .eq('id', subscription.id);

  // Update coach stats
  await supabase.rpc('increment_coach_disputes', {
    coach_id: subscription.coach_id,
  });

  // Send notifications
  await sendDisputeNotificationToCoach(subscription.coach_id, {
    amount,
    reason,
    user: subscription.user_id,
  });

  await sendDisputeAlertToPlatformAdmin({
    coach: subscription.coaches.business_name,
    amount,
    reason,
  });
}

async function handleDisputeClosed(dispute) {
  const { id: disputeId, status: outcome } = dispute; // 'won' or 'lost'

  // Update dispute record
  await supabase
    .from('dispute_records')
    .update({
      status: outcome,
      resolved_at: new Date().toISOString(),
    })
    .eq('stripe_dispute_id', disputeId);

  if (outcome === 'won') {
    // Platform won! Restore coach's funds if we reversed
    const { data: disputeRecord } = await supabase
      .from('dispute_records')
      .select('*')
      .eq('stripe_dispute_id', disputeId)
      .single();

    // Re-transfer funds to coach
    if (disputeRecord.amount_recovered > 0) {
      await stripe.transfers.create({
        amount: disputeRecord.amount_recovered,
        currency: 'usd',
        destination: disputeRecord.coaches.stripe_account_id,
        description: 'Dispute won - funds returned',
      });
    }

    // Restore subscription
    await supabase
      .from('user_subscriptions')
      .update({
        status: 'active',
        dispute_status: 'won',
      })
      .eq('subscription_id', disputeRecord.subscription_id);
  } else {
    // Platform lost, keep the reversal, revoke access
    await supabase
      .from('user_subscriptions')
      .update({
        status: 'refunded',
        dispute_status: 'lost',
      })
      .eq('stripe_dispute_id', disputeId);
  }
}
```

---

## Financial Risk Summary

| Scenario                         | Platform Risk                 | Coach Risk              | Mitigation                                              |
| -------------------------------- | ----------------------------- | ----------------------- | ------------------------------------------------------- |
| User cancels normally            | None                          | None                    | User completes period                                   |
| Platform issues refund           | Loses commission + Stripe fee | Loses payout            | Mutual agreement                                        |
| User disputes charge             | Loses full amount + $15 fee   | Loses payout (reversed) | Evidence submission, dispute rate monitoring            |
| Dispute and coach withdrew funds | High (coach balance negative) | Medium (held payouts)   | 7-day payout delay, reserve fund                        |
| Coach fraud/pattern disputes     | Very High                     | Account termination     | Automatic flagging, manual review, contract enforcement |

**Platform Protection Checklist:**

- ✅ Implement 7-day payout delay for new coaches
- ✅ Monitor dispute rates per coach
- ✅ Auto-flag coaches with >3% dispute rate
- ✅ Maintain 5% reserve fund
- ✅ Clear billing descriptors
- ✅ Detailed receipts and evidence
- ✅ Strong coach agreement terms
- ✅ Fraud detection alerts

---

## Database Schema Requirements

### Existing Tables (Already in schema.sql)

```sql
-- coaches table
coaches (
  id UUID PRIMARY KEY,
  profile_id UUID REFERENCES profiles(id),
  stripe_account_id TEXT,              -- Stripe Connected Account ID
  stripe_account_status TEXT,          -- 'pending', 'active', 'restricted'
  platform_subscription_id TEXT,       -- Coach's subscription to platform
  platform_subscription_status TEXT,   -- 'active', 'past_due', 'canceled'
  platform_subscription_ends_at TIMESTAMPTZ,
  setup_fee_paid BOOLEAN DEFAULT false, -- Whether coach paid one-time setup fee
  setup_fee_paid_at TIMESTAMPTZ,       -- When setup fee was paid
  setup_fee_amount_cents INTEGER,      -- Amount paid for setup (for record keeping)
  user_monthly_price_cents INTEGER,    -- What end users pay
  user_yearly_price_cents INTEGER,
  ...
)

-- user_subscriptions table
user_subscriptions (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  coach_id UUID REFERENCES coaches(id),
  stripe_subscription_id TEXT,         -- Stripe subscription ID
  stripe_customer_id TEXT,             -- Stripe customer ID
  status TEXT,                         -- 'active', 'past_due', 'canceled', 'trialing'
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  canceled_at TIMESTAMPTZ,
  ...
)

-- platform_settings table
platform_settings (
  key TEXT UNIQUE,
  value JSONB,
  ...
)
-- Store: platform_fee_percentage (e.g., 20)
-- Store: coach_monthly_price_cents (e.g., 5000 = $50)
-- Store: coach_setup_fee_cents (e.g., 10000 = $100)
```

---

## Implementation Overview

### Environment Variables Needed

```env
# Stripe Keys
STRIPE_SECRET_KEY=sk_live_...           # Platform's secret key
STRIPE_PUBLISHABLE_KEY=pk_live_...     # Platform's publishable key
STRIPE_WEBHOOK_SECRET=whsec_...        # For webhook signature verification

# Stripe Connect
STRIPE_CONNECT_CLIENT_ID=ca_...        # For OAuth Connect flow

# App URLs
NEXT_PUBLIC_APP_URL=https://dailycompanion.com
```

### Key API Endpoints to Implement

#### 1. Coach Subscription to Platform

**`POST /api/stripe/coach-checkout`**

```javascript
// Create Stripe Checkout session for coach to subscribe to platform
// Input: coachId, plan (monthly/yearly)
// Output: checkoutUrl
// Flow: Coach → Checkout → Payment → Webhook updates DB
//
// Logic:
// 1. Check if coach has already paid setup fee (coach.setup_fee_paid)
// 2. If NOT paid:
//    - Include both setup fee (one-time) + subscription (recurring) in line_items
//    - Set metadata.includes_setup_fee = 'true'
// 3. If already paid:
//    - Include only subscription (recurring) in line_items
// 4. Return checkout URL

export async function POST(request) {
  const { coachId } = await request.json();

  // Fetch coach from DB
  const { data: coach } = await supabase
    .from("coaches")
    .select("*")
    .eq("id", coachId)
    .single();

  // Get platform settings
  const setupFeeCents = 10000; // $100 - could be from platform_settings
  const monthlyFeeCents = 5000; // $50 - could be from platform_settings

  // Build line items
  const lineItems = [];

  // Add one-time setup fee if not yet paid
  if (!coach.setup_fee_paid) {
    lineItems.push({
      price_data: {
        currency: "usd",
        product_data: {
          name: "Platform Setup Fee",
          description: "One-time activation fee",
        },
        unit_amount: setupFeeCents,
      },
      quantity: 1,
    });
  }

  // Add recurring monthly subscription
  lineItems.push({
    price: process.env.STRIPE_MONTHLY_PRICE_ID, // Pre-created in Stripe
    quantity: 1,
  });

  // Create Checkout Session
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: coach.stripe_customer_id,
    line_items: lineItems,
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?setup=success`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?setup=cancelled`,
    metadata: {
      type: "coach_subscription",
      coachId: coach.id,
      includes_setup_fee: !coach.setup_fee_paid ? "true" : "false",
    },
  });

  return Response.json({ checkoutUrl: session.url });
}
```

#### 2. Coach Stripe Connect Onboarding

**`POST /api/stripe/connect`**

```javascript
// Create Stripe Connected Account for coach
// Input: coachId
// Output: onboardingUrl (Stripe-hosted)
// Flow: Coach → Stripe onboarding → Verification → Webhook updates DB
//
// IMPORTANT: Gate this action - only allow if coach.setup_fee_paid = true

export async function POST(request) {
  const { coachId } = await request.json();

  // Fetch coach from DB
  const { data: coach } = await supabase
    .from("coaches")
    .select("*")
    .eq("id", coachId)
    .single();

  // Verify setup fee was paid
  if (!coach.setup_fee_paid) {
    return Response.json(
      { error: "Setup fee must be paid before connecting Stripe account" },
      { status: 403 }
    );
  }

  // Create Connected Account if not exists
  let accountId = coach.stripe_account_id;

  if (!accountId) {
    const account = await stripe.accounts.create({
      type: "express",
      country: "US",
      email: coach.email,
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
      metadata: {
        coach_id: coachId,
      },
    });

    accountId = account.id;

    // Save to DB
    await supabase
      .from("coaches")
      .update({ stripe_account_id: accountId })
      .eq("id", coachId);
  }

  // Create account link for onboarding
  const accountLink = await stripe.accountLinks.create({
    account: accountId,
    refresh_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?stripe=refresh`,
    return_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?stripe=success`,
    type: "account_onboarding",
  });

  return Response.json({ onboardingUrl: accountLink.url });
}
```

**`GET /api/stripe/connect/refresh`**

```javascript
// Generate refresh URL if coach needs to complete onboarding
// Input: coachId
// Output: refreshUrl
```

**`GET /api/stripe/connect/dashboard`**

```javascript
// Create login link to Stripe Express Dashboard
// Input: coachId
// Output: dashboardUrl (for coach to view earnings, payouts)
```

#### 3. End-User Subscription to Coach

**`POST /api/stripe/user-checkout`**

```javascript
// Create Stripe Checkout session for user to subscribe to coach
// Input: userId, coachId, plan (monthly/yearly)
// Output: checkoutUrl
// Key: Use application_fee_amount to take platform cut
```

**`POST /api/stripe/portal`**

```javascript
// Create Stripe Customer Portal session
// Input: userId, coachId
// Output: portalUrl (for user to manage subscription, update payment method)
```

#### 4. Webhook Handler

**`POST /api/stripe/webhook`**

```javascript
// Handle all Stripe webhook events
// Events to handle:
// - checkout.session.completed (new subscription)
// - customer.subscription.updated (subscription changed)
// - customer.subscription.deleted (subscription canceled)
// - invoice.payment_succeeded (successful renewal)
// - invoice.payment_failed (failed payment)
// - account.updated (Connected Account status changed)
// - account.application.deauthorized (coach disconnected)
```

---

## High-Level Code Structure

### 1. Stripe Library Setup

**`/src/lib/stripe.js`**

```javascript
import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2023-10-16",
});

// Helper: Create Connected Account
export async function createConnectedAccount(coachId, email) {
  const account = await stripe.accounts.create({
    type: "express",
    country: "US",
    email: email,
    capabilities: {
      card_payments: { requested: true },
      transfers: { requested: true },
    },
  });

  return account;
}

// Helper: Create Account Link (onboarding)
export async function createAccountLink(accountId, coachSlug) {
  const accountLink = await stripe.accountLinks.create({
    account: accountId,
    refresh_url: `${process.env.NEXT_PUBLIC_APP_URL}/coach/${coachSlug}/settings?stripe=refresh`,
    return_url: `${process.env.NEXT_PUBLIC_APP_URL}/coach/${coachSlug}/settings?stripe=success`,
    type: "account_onboarding",
  });

  return accountLink;
}

// Helper: Create Checkout Session for User → Coach
export async function createUserCheckoutSession({
  coachId,
  coachStripeAccountId,
  userEmail,
  priceInCents,
  platformFeePercent,
  successUrl,
  cancelUrl,
}) {
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    payment_method_types: ["card"],
    customer_email: userEmail,
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: {
            name: "Coaching Subscription",
          },
          unit_amount: priceInCents,
          recurring: { interval: "month" },
        },
        quantity: 1,
      },
    ],
    subscription_data: {
      application_fee_percent: platformFeePercent,
      transfer_data: {
        destination: coachStripeAccountId,
      },
    },
    success_url: successUrl,
    cancel_url: cancelUrl,
  });

  return session;
}
```

### 2. Webhook Handler Logic

**`/src/app/api/stripe/webhook/route.js`**

```javascript
import { stripe } from "@/lib/stripe";
import { supabase } from "@/lib/supabase";

export async function POST(request) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    return new Response(`Webhook Error: ${err.message}`, { status: 400 });
  }

  // Handle different event types
  switch (event.type) {
    case "checkout.session.completed":
      await handleCheckoutCompleted(event.data.object);
      break;

    case "customer.subscription.updated":
      await handleSubscriptionUpdated(event.data.object);
      break;

    case "customer.subscription.deleted":
      await handleSubscriptionDeleted(event.data.object);
      break;

    case "invoice.payment_succeeded":
      await handlePaymentSucceeded(event.data.object);
      break;

    case "invoice.payment_failed":
      await handlePaymentFailed(event.data.object);
      break;

    case "account.updated":
      await handleAccountUpdated(event.data.object);
      break;
  }

  return new Response(JSON.stringify({ received: true }), { status: 200 });
}

async function handleCheckoutCompleted(session) {
  // Determine if this is coach subscription or user subscription
  const metadata = session.metadata;

  if (metadata.type === "coach_subscription") {
    // Check if this includes setup fee
    const includesSetupFee = metadata.includes_setup_fee === "true";

    // Retrieve line items to verify setup fee was paid
    const lineItems = await stripe.checkout.sessions.listLineItems(session.id);
    const setupFeeItem = includesSetupFee
      ? lineItems.data.find((item) => item.description?.includes("Setup Fee"))
      : null;

    // Update coach's platform subscription
    const updateData = {
      platform_subscription_id: session.subscription,
      platform_subscription_status: "active",
    };

    // If setup fee was included, mark it as paid
    if (includesSetupFee && setupFeeItem) {
      updateData.setup_fee_paid = true;
      updateData.setup_fee_paid_at = new Date().toISOString();
      updateData.setup_fee_amount_cents = setupFeeItem.amount_total;
    }

    await supabase
      .from("coaches")
      .update(updateData)
      .eq("id", metadata.coachId);

    // Send welcome email if setup fee was paid
    if (includesSetupFee) {
      await sendCoachWelcomeEmail(metadata.coachId);
    }
  } else if (metadata.type === "user_subscription") {
    // Create user subscription record
    await supabase.from("user_subscriptions").insert({
      user_id: metadata.userId,
      coach_id: metadata.coachId,
      stripe_subscription_id: session.subscription,
      stripe_customer_id: session.customer,
      status: "active",
    });
  }
}
```

### 3. UI Integration Points

**Coach Onboarding Flow:**

```
1. /coach/signup → Sign up form
2. /coach/dashboard → "Complete Stripe Setup" button
3. → POST /api/stripe/connect → Redirect to Stripe
4. ← Return to /coach/dashboard?stripe=success
5. Show "✓ Payments Enabled"
```

**User Subscription Flow:**

```
1. /coach/[slug] → Landing page
2. "Subscribe" button → POST /api/stripe/user-checkout
3. Redirect to Stripe Checkout
4. ← Return to /user/dashboard?subscription=success
5. Access granted
```

---

## Testing Strategy

### 1. Use Stripe Test Mode

```env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
```

### 2. Test Cards

```
Success: 4242 4242 4242 4242
Decline: 4000 0000 0000 0002
Auth Required: 4000 0025 0000 3155
```

### 3. Stripe CLI for Webhooks

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

### 4. Test Checklist

- [ ] Coach can subscribe to platform (with setup fee)
- [ ] Setup fee is only charged once
- [ ] Coach cannot access Stripe Connect onboarding before paying setup fee
- [ ] Coach can complete Stripe Connect onboarding after setup fee
- [ ] User can subscribe to coach
- [ ] Platform fee is correctly deducted
- [ ] Subscription renews automatically (without charging setup fee again)
- [ ] Failed payments are handled
- [ ] Cancellations work correctly
- [ ] Refunds are processed
- [ ] Disputes are detected and handled
- [ ] Transfer reversals work for disputes
- [ ] Coach re-subscription doesn't charge setup fee again
- [ ] Coach can access Stripe dashboard

---

## Security Considerations

1. **Webhook Signature Verification**

   - Always verify webhook signatures
   - Prevents fake webhook calls

2. **Idempotency**

   - Use `stripe_subscription_id` as unique constraint
   - Prevent duplicate subscription records

3. **Error Handling**

   - Gracefully handle failed payments
   - Show user-friendly error messages
   - Log all Stripe errors for debugging

4. **PCI Compliance**

   - Never store card details
   - Use Stripe Checkout or Elements
   - Let Stripe handle all payment data

5. **Connected Account Verification**
   - Check `charges_enabled` and `payouts_enabled`
   - Don't allow subscriptions if coach isn't verified

---

## Migration Plan

### Phase 1: Setup (Week 1)

- [ ] Create Stripe account
- [ ] Add environment variables
- [ ] Install Stripe SDK
- [ ] Create `/lib/stripe.js`

### Phase 2: Coach Flow (Week 2)

- [ ] Implement coach platform subscription
- [ ] Implement Stripe Connect onboarding
- [ ] Test Connected Account creation
- [ ] Handle webhook events for coaches

### Phase 3: User Flow (Week 3)

- [ ] Implement user subscription checkout
- [ ] Configure application fees
- [ ] Test payment splitting
- [ ] Handle subscription webhooks

### Phase 4: Management (Week 4)

- [ ] Add subscription management UI
- [ ] Implement cancellation flow
- [ ] Add Stripe Customer Portal
- [ ] Create coach earnings dashboard

### Phase 5: Production (Week 5)

- [ ] Switch to live Stripe keys
- [ ] Test with real (small) payments
- [ ] Monitor webhook delivery
- [ ] Launch! 🚀

---

## Cost Breakdown

### Stripe Fees

1. **Standard Processing**: 2.9% + $0.30 per transaction
2. **Connect Platform**: Additional 0.25% for Connect transactions
3. **Total Platform Cost**: ~3.15% + $0.30 per user subscription

### Example Calculation

```
User pays coach: $29.99/month
Platform takes: 20% = $5.99
Coach receives: 80% = $24.00

Stripe fees (on $29.99):
- Processing: $0.87 (2.9%) + $0.30 = $1.17
- Connect fee: $0.07 (0.25%)
- Total Stripe fee: $1.24

Platform net: $5.99 - $1.24 = $4.75/user/month
Coach net: $24.00 (no Stripe fees, paid by platform)
```

---

## Frequently Asked Questions

### Setup Fee

**Q: When is the setup fee charged?**
A: The setup fee is charged when a coach first subscribes to the platform. It's a one-time payment included in the initial checkout session along with the first month's subscription fee.

**Q: What if a coach cancels and re-subscribes later?**
A: The setup fee is only charged once per coach account. If a coach cancels their subscription and later re-subscribes, they will only be charged the monthly subscription fee, not the setup fee again.

**Q: Can the setup fee amount be changed?**
A: Yes, the setup fee amount should be stored in `platform_settings` and can be updated by platform admins. However, changing it only affects new coach signups - existing coaches who already paid will not be affected.

**Q: Is the setup fee refundable?**
A: No, the setup fee is non-refundable. This should be clearly stated in the Terms of Service. Even if a coach cancels their subscription, the setup fee is not refunded.

**Q: What happens if the payment fails?**
A: If the initial payment (setup fee + first month) fails, the coach account remains inactive (`setup_fee_paid = false`, `is_active = false`). The coach will need to retry the payment to activate their account.

**Q: Can a coach access any platform features before paying the setup fee?**
A: No, critical features should be gated:

- ❌ Cannot onboard Stripe Connect
- ❌ Cannot accept user subscriptions
- ❌ Cannot access payment/earnings dashboards
- ✅ Can access basic profile/settings pages
- ✅ Can preview configuration options

**Q: How do we track setup fee payments?**
A: Three fields in the `coaches` table:

- `setup_fee_paid` (boolean) - Whether it was paid
- `setup_fee_paid_at` (timestamp) - When it was paid
- `setup_fee_amount_cents` (integer) - Amount paid (for record keeping)

---

## Support Resources

- [Stripe Connect Docs](https://stripe.com/docs/connect)
- [Stripe Subscriptions Guide](https://stripe.com/docs/billing/subscriptions/overview)
- [Stripe Webhooks Reference](https://stripe.com/docs/webhooks)
- [Stripe Testing Guide](https://stripe.com/docs/testing)

---

## Notes

- Use **Express Connect** for faster onboarding (recommended)
- Use **Standard Connect** if coaches need more control
- Set up **fraud protection** in Stripe Dashboard
- Enable **Radar** for fraud detection (included in pricing)
- Consider adding **Stripe Tax** for automatic tax calculation
- Set up **Payout schedule** (daily/weekly/monthly) for coaches
- **Setup fee is non-refundable** - clearly state in Terms of Service