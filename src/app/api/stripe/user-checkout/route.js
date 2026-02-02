import { NextResponse } from 'next/server';
import { getCurrentUser, getCoachBySlug } from '@/lib/auth';
import { createUserSubscriptionCheckout } from '@/lib/stripe';
import { supabase } from '@/lib/supabase';

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

    let coach;

    // If coachSlug is provided, use that. Otherwise use user's assigned coach
    if (coachSlug) {
      coach = await getCoachBySlug(coachSlug);
    } else if (user.coach_id) {
      // User already has a coach assigned - get coach details
      const { data: coachData } = await supabase
        .from('coaches')
        .select('*')
        .eq('id', user.coach_id)
        .single();
      
      coach = coachData;
    }

    if (!coach) {
      return NextResponse.json(
        { error: 'No coach found. Please sign up through a coach first.' },
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

