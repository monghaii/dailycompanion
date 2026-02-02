import { NextResponse } from 'next/server';
import { getCurrentUserWithCoach } from '@/lib/auth';
import { createConnectDashboardLink } from '@/lib/stripe';

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

    const stripeAccountId = user.coach.stripe_account_id;

    if (!stripeAccountId) {
      return NextResponse.json(
        { error: 'No Stripe account connected' },
        { status: 400 }
      );
    }

    if (user.coach.stripe_account_status !== 'active') {
      return NextResponse.json(
        { error: 'Stripe account is not active yet' },
        { status: 400 }
      );
    }

    // Create login link to Stripe Express dashboard
    const loginLink = await createConnectDashboardLink(stripeAccountId);

    return NextResponse.json({ url: loginLink.url });
  } catch (error) {
    console.error('Dashboard link error:', error);
    return NextResponse.json(
      { error: 'Failed to create dashboard link' },
      { status: 500 }
    );
  }
}
