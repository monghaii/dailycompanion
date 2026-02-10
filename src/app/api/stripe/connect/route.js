import { NextResponse } from 'next/server';
import { getCurrentUserWithCoach } from '@/lib/auth';
import { createConnectAccount, createConnectOnboardingLink, deleteConnectAccount, stripe } from '@/lib/stripe';
import { supabase } from '@/lib/supabase';

export async function POST(request) {
  try {
    const user = await getCurrentUserWithCoach();
    const { country } = await request.json().catch(() => ({})); // Read country from body

    if (!user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    if (user.role !== 'coach' || !user.coach) {
      return NextResponse.json(
        { error: 'Only coaches can access this endpoint' },
        { status: 403 }
      );
    }

    let stripeAccountId = user.coach.stripe_account_id;

    // Check if we need to recreate the account
    if (stripeAccountId) {
      try {
        const existingAccount = await stripe.accounts.retrieve(stripeAccountId);
        
        // Recreate if incomplete OR wrong country
        const needsRecreate = 
          !existingAccount.details_submitted || 
          (country && existingAccount.country !== country);

        if (needsRecreate) {
          console.log(`Recreating Stripe account for coach ${user.coach.id}: incomplete=${!existingAccount.details_submitted}, country mismatch=${existingAccount.country} !== ${country}`);
          
          // Delete old account
          await deleteConnectAccount(stripeAccountId);
          
          // Clear from database
          await supabase
            .from('coaches')
            .update({ stripe_account_id: null, stripe_account_status: null })
            .eq('id', user.coach.id);
          
          stripeAccountId = null;
        }
      } catch (error) {
        // If account doesn't exist in Stripe, clear it from database
        console.log(`Stripe account ${stripeAccountId} not found, clearing from database`);
        await supabase
          .from('coaches')
          .update({ stripe_account_id: null, stripe_account_status: null })
          .eq('id', user.coach.id);
        stripeAccountId = null;
      }
    }

    // Create Stripe Connect account if doesn't exist
    if (!stripeAccountId) {
      const account = await createConnectAccount({
        coachId: user.coach.id,
        email: user.email,
        country, // Pass country to creation function
      });
      stripeAccountId = account.id;
    }

    // Create onboarding link
    const accountLink = await createConnectOnboardingLink(
      stripeAccountId,
      user.coach.id
    );

    return NextResponse.json({ url: accountLink.url });
  } catch (error) {
    console.error('Connect account error:', error);
    return NextResponse.json(
      { error: 'Failed to set up payment account' },
      { status: 500 }
    );
  }
}

