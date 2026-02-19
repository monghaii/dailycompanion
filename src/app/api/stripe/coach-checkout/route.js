import { NextResponse } from 'next/server';
import { getCurrentUserWithCoach } from '@/lib/auth';
import { createCoachCheckoutSession } from '@/lib/stripe';
import { trackServerEvent } from '@/lib/posthog';

export async function POST(request) {
  try {
    const user = await getCurrentUserWithCoach();

    if (!user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    if (user.role !== 'coach') {
      return NextResponse.json(
        { error: 'Only coaches can access this endpoint' },
        { status: 403 }
      );
    }

    // Create checkout session with setup fee + monthly subscription
    const session = await createCoachCheckoutSession({
      coachId: user.coach?.id,
      profileId: user.id,
      email: user.email,
    });

    trackServerEvent(user.id, "checkout_initiated", {
      type: "coach",
      coach_id: user.coach?.id,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('Coach checkout error:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}

