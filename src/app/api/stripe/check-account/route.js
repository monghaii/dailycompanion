import { NextResponse } from 'next/server';
import { getCurrentUserWithCoach } from '@/lib/auth';
import { stripe } from '@/lib/stripe';

export async function GET() {
  try {
    const user = await getCurrentUserWithCoach();

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

    const stripeAccountId = user.coach.stripe_account_id;

    if (!stripeAccountId) {
      return NextResponse.json({
        exists: false,
        message: 'No Stripe account linked'
      });
    }

    try {
      const account = await stripe.accounts.retrieve(stripeAccountId);
      
      return NextResponse.json({
        exists: true,
        accountId: account.id,
        country: account.country,
        detailsSubmitted: account.details_submitted,
        chargesEnabled: account.charges_enabled,
        payoutsEnabled: account.payouts_enabled,
        created: new Date(account.created * 1000).toISOString(),
      });
    } catch (error) {
      return NextResponse.json({
        exists: false,
        error: 'Account not found in Stripe',
        accountId: stripeAccountId
      });
    }
  } catch (error) {
    console.error('Check account error:', error);
    return NextResponse.json(
      { error: 'Failed to check account' },
      { status: 500 }
    );
  }
}
