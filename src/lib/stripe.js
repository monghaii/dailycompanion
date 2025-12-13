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
  };
}

// Create Stripe Checkout session for coach subscription
export async function createCoachCheckoutSession({ coachId, profileId, email, plan }) {
  const settings = await getPlatformSettings();
  
  const priceInCents = plan === 'yearly' 
    ? settings.coachYearlyPriceCents 
    : settings.coachMonthlyPriceCents;

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    payment_method_types: ['card'],
    customer_email: email,
    line_items: [
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name: `Daily Companion Coach ${plan === 'yearly' ? 'Annual' : 'Monthly'} Plan`,
            description: 'Access to the Daily Companion coach platform',
          },
          unit_amount: priceInCents,
          recurring: {
            interval: plan === 'yearly' ? 'year' : 'month',
          },
        },
        quantity: 1,
      },
    ],
    metadata: {
      coachId,
      profileId,
      type: 'coach_subscription',
    },
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?subscription=success`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/coach/signup?subscription=canceled`,
  });

  return session;
}

// Create Stripe Connect account for coach
export async function createConnectAccount({ coachId, email }) {
  const account = await stripe.accounts.create({
    type: 'express',
    email,
    capabilities: {
      card_payments: { requested: true },
      transfers: { requested: true },
    },
    metadata: {
      coachId,
    },
  });

  // Update coach with Stripe account ID
  await supabase
    .from('coaches')
    .update({ stripe_account_id: account.id })
    .eq('id', coachId);

  return account;
}

// Create Stripe Connect onboarding link
export async function createConnectOnboardingLink(accountId, coachId) {
  const accountLink = await stripe.accountLinks.create({
    account: accountId,
    refresh_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings?connect=refresh`,
    return_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings?connect=complete`,
    type: 'account_onboarding',
  });

  return accountLink;
}

// Create checkout session for user subscribing to a coach
export async function createUserSubscriptionCheckout({ userId, coach, email }) {
  const settings = await getPlatformSettings();
  const platformFee = settings.platformFeePercentage / 100;

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    payment_method_types: ['card'],
    customer_email: email,
    line_items: [
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name: `${coach.business_name} Subscription`,
            description: `Monthly subscription to ${coach.business_name}`,
          },
          unit_amount: coach.user_monthly_price_cents,
          recurring: {
            interval: 'month',
          },
        },
        quantity: 1,
      },
    ],
    payment_intent_data: {
      application_fee_amount: Math.round(coach.user_monthly_price_cents * platformFee),
      transfer_data: {
        destination: coach.stripe_account_id,
      },
    },
    subscription_data: {
      application_fee_percent: settings.platformFeePercentage,
      transfer_data: {
        destination: coach.stripe_account_id,
      },
    },
    metadata: {
      userId,
      coachId: coach.id,
      type: 'user_subscription',
    },
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/coach/${coach.slug}/dashboard?subscription=success`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/coach/${coach.slug}?subscription=canceled`,
  });

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

