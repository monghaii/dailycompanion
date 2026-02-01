import { NextResponse } from 'next/server';
import { getCurrentUser, getCoachBySlug } from '@/lib/auth';
import { createUserSubscriptionCheckout } from '@/lib/stripe';

export async function POST(request) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { coachSlug } = body;

    if (!coachSlug) {
      return NextResponse.json(
        { error: 'Coach slug is required' },
        { status: 400 }
      );
    }

    const coach = await getCoachBySlug(coachSlug);

    if (!coach) {
      return NextResponse.json(
        { error: 'Coach not found' },
        { status: 404 }
      );
    }

    // Coach must have active platform subscription
    if (!coach.is_active || coach.platform_subscription_status !== 'active') {
      return NextResponse.json(
        { error: 'Coach is not accepting subscriptions' },
        { status: 400 }
      );
    }

    // Note: Coach doesn't need Stripe Connect yet - we'll hold funds until they connect

    const session = await createUserSubscriptionCheckout({
      userId: user.id,
      coach,
      email: user.email,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('User checkout error:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}

