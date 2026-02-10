import Stripe from 'stripe';
import { supabase } from './supabase';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
});

// Get platform settings
export async function getPlatformSettings() {
  const { data: settings } = await supabase
    .from('platform_settings')
    .select('key, value');

  const settingsMap = {};
  settings?.forEach((s) => {
    settingsMap[s.key] = s.value;
  });

  return {
    platformFeePercentage: settingsMap.platform_fee_percentage || 20,
    coachMonthlyPriceCents: settingsMap.coach_monthly_price_cents || 5000,
    coachYearlyPriceCents: settingsMap.coach_yearly_price_cents || 50000,
    coachSetupFeePriceId: settingsMap.coach_setup_fee_price_id?.replace(/"/g, '') || null,
    coachMonthlySubscriptionPriceId: settingsMap.coach_monthly_subscription_price_id?.replace(/"/g, '') || null,
  };
}

// Create Stripe Checkout session for coach subscription (with setup fee + recurring)
export async function createCoachCheckoutSession({ coachId, profileId, email }) {
  const settings = await getPlatformSettings();
  
  // Check if coach already paid setup fee
  const { data: coach } = await supabase
    .from('coaches')
    .select('setup_fee_paid, stripe_customer_id')
    .eq('id', coachId)
    .single();
  
  const setupFeePriceId = settings.coachSetupFeePriceId;
  const monthlyPriceId = settings.coachMonthlySubscriptionPriceId;
  
  // Build line items based on whether setup fee is needed
  const lineItems = [];
  
  // Always add the monthly subscription
  if (monthlyPriceId) {
    lineItems.push({
      price: monthlyPriceId,
      quantity: 1,
    });
  } else {
    // Fallback: create price inline if not configured in settings
    lineItems.push({
      price_data: {
        currency: 'usd',
        product_data: {
          name: 'Daily Companion Coach Monthly Plan',
          description: 'Monthly subscription for coaches to access the platform',
        },
        unit_amount: 14900, // $149.00
        recurring: {
          interval: 'month',
        },
      },
      quantity: 1,
    });
  }
  
  // Add setup fee if not already paid
  if (!coach?.setup_fee_paid) {
    if (setupFeePriceId) {
      lineItems.push({
        price: setupFeePriceId,
        quantity: 1,
      });
    } else {
      // Fallback: create price inline if not configured in settings
      lineItems.push({
        price_data: {
          currency: 'usd',
          product_data: {
            name: 'Daily Companion Coach - Setup Fee',
            description: 'One-time setup fee for coaches',
          },
          unit_amount: 50000, // $500.00
        },
        quantity: 1,
      });
    }
  }

  const sessionConfig = {
    mode: 'subscription',
    payment_method_types: ['card'],
    customer_email: email,
    line_items: lineItems,
    allow_promotion_codes: true, // Allow users to enter coupon codes
    metadata: {
      coachId,
      profileId,
      type: 'coach_subscription',
      includesSetupFee: (!coach?.setup_fee_paid).toString(),
    },
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?subscription=success`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?subscription=canceled`,
  };
  
  // If coach already has a stripe customer ID, use it
  if (coach?.stripe_customer_id) {
    sessionConfig.customer = coach.stripe_customer_id;
  }

  const session = await stripe.checkout.sessions.create(sessionConfig);

  return session;
}

// Create Stripe Connect account for coach
export async function createConnectAccount({ coachId, email, country }) {
  console.log('🔧 createConnectAccount called with:', { coachId, email, country });
  
  const accountData = {
    type: 'express',
    email,
    capabilities: {
      card_payments: { requested: true },
      transfers: { requested: true },
    },
    metadata: {
      coachId,
    },
  };

  // If country is provided, add it to account creation
  if (country) {
    accountData.country = country;
    console.log('✅ Setting account country to:', country);
  } else {
    console.warn('⚠️ No country provided, Stripe will default to US');
  }

  console.log('📤 Creating Stripe account with data:', JSON.stringify(accountData, null, 2));
  const account = await stripe.accounts.create(accountData);
  console.log('✅ Account created:', account.id, 'Country:', account.country);

  // Update coach with Stripe account ID
  await supabase
    .from('coaches')
    .update({ stripe_account_id: account.id })
    .eq('id', coachId);

  return account;
}

// Delete Stripe Connect account
export async function deleteConnectAccount(accountId) {
  await stripe.accounts.del(accountId);
}

// Create Stripe Connect onboarding link
export async function createConnectOnboardingLink(accountId, coachId) {
  const accountLink = await stripe.accountLinks.create({
    account: accountId,
    refresh_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?connect=refresh`,
    return_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?connect=complete`,
    type: 'account_onboarding',
  });

  return accountLink;
}

// Create Stripe Connect dashboard link (for already onboarded accounts)
export async function createConnectDashboardLink(accountId) {
  const loginLink = await stripe.accounts.createLoginLink(accountId);
  return loginLink;
}

// Create checkout session for user subscribing to a coach
export async function createUserSubscriptionCheckout({ userId, coach, email }) {
  // Fixed pricing: $19.99/month for users
  // Platform takes $7, coach gets $12.99
  const userPriceCents = 1999; // $19.99
  const platformFeeCents = 700; // $7
  const coachReceivesCents = userPriceCents - platformFeeCents; // $12.99
  
  // Calculate what percentage $7 fee represents (for Stripe's application_fee_percent)
  // Use toFixed(2) and parseFloat to ensure exactly 2 decimal places
  const effectiveFeePercentage = parseFloat(((platformFeeCents / userPriceCents) * 100).toFixed(2));

  const sessionConfig = {
    mode: 'subscription',
    payment_method_types: ['card'],
    customer_email: email,
    line_items: [
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name: `${coach.business_name} - Premium Subscription`,
            description: `Premium access to ${coach.business_name}`,
          },
          unit_amount: userPriceCents,
          recurring: {
            interval: 'month',
          },
        },
        quantity: 1,
      },
    ],
    subscription_data: {
      application_fee_percent: effectiveFeePercentage,
      metadata: {
        platform_fee_cents: platformFeeCents.toString(),
        coach_receives_cents: coachReceivesCents.toString(),
      },
    },
    metadata: {
      userId,
      coachId: coach.id,
      type: 'user_subscription',
      platform_fee_cents: platformFeeCents.toString(),
      price_per_month: '19.99',
    },
    allow_promotion_codes: true, // Allow coupon codes
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/user/dashboard?subscription=success`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/user/dashboard?subscription=canceled`,
  };
  
  // Only add transfer_data if coach has connected Stripe account
  if (coach.stripe_account_id && coach.stripe_account_status === 'active') {
    sessionConfig.subscription_data.transfer_data = {
      destination: coach.stripe_account_id,
    };
  }

  const session = await stripe.checkout.sessions.create(sessionConfig);

  return session;
}

// Check if coach's Stripe Connect account is active
export async function checkConnectAccountStatus(accountId) {
  const account = await stripe.accounts.retrieve(accountId);
  
  const isActive = account.charges_enabled && account.payouts_enabled;
  
  return {
    isActive,
    chargesEnabled: account.charges_enabled,
    payoutsEnabled: account.payouts_enabled,
    detailsSubmitted: account.details_submitted,
  };
}

