import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Get user profile to check test premium flag
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('is_test_premium')
      .eq('id', user.id)
      .single();

    // If user is flagged as test premium, grant access immediately
    if (profile?.is_test_premium === true) {
      return NextResponse.json({
        isPremium: true,
        status: 'test_premium',
        subscription: null,
      });
    }

    // Get user's subscription
    const { data: subscription, error: subError } = await supabase
      .from('user_subscriptions')
      .select(`
        *,
        coaches:coach_id (
          business_name,
          slug,
          user_monthly_price_cents
        )
      `)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single();

    if (subError || !subscription) {
      // No active subscription - user is FREE
      return NextResponse.json({
        isPremium: false,
        status: 'free',
        subscription: null,
      });
    }

    // User has active subscription - PREMIUM
    return NextResponse.json({
      isPremium: true,
      status: subscription.status,
      subscription: {
        id: subscription.id,
        coach: subscription.coaches,
        pricePerMonth: subscription.coaches.user_monthly_price_cents / 100,
        currentPeriodEnd: subscription.current_period_end,
        canceledAt: subscription.canceled_at,
        willCancelAtPeriodEnd: !!subscription.canceled_at,
      },
    });
  } catch (error) {
    console.error('Get subscription status error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch subscription status' },
      { status: 500 }
    );
  }
}
