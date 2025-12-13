import { NextResponse } from 'next/server';
import { getCurrentUserWithCoach } from '@/lib/auth';
import { createConnectAccount, createConnectOnboardingLink } from '@/lib/stripe';

export async function POST() {
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

    let stripeAccountId = user.coach.stripe_account_id;

    // Create Stripe Connect account if doesn't exist
    if (!stripeAccountId) {
      const account = await createConnectAccount({
        coachId: user.coach.id,
        email: user.email,
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

