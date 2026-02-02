import { NextResponse } from 'next/server';
import { getCurrentUserWithCoach } from '@/lib/auth';
import { checkConnectAccountStatus } from '@/lib/stripe';
import { supabase } from '@/lib/supabase';

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
        connected: false,
        status: 'not_created',
      });
    }

    // Check status with Stripe
    const accountStatus = await checkConnectAccountStatus(stripeAccountId);

    // Update database if status changed
    const newStatus = accountStatus.isActive ? 'active' : 'pending';
    
    if (user.coach.stripe_account_status !== newStatus) {
      await supabase
        .from('coaches')
        .update({ stripe_account_status: newStatus })
        .eq('id', user.coach.id);
    }

    return NextResponse.json({
      connected: !!stripeAccountId,
      status: newStatus,
      chargesEnabled: accountStatus.chargesEnabled,
      payoutsEnabled: accountStatus.payoutsEnabled,
      detailsSubmitted: accountStatus.detailsSubmitted,
    });
  } catch (error) {
    console.error('Account status error:', error);
    return NextResponse.json(
      { error: 'Failed to check account status' },
      { status: 500 }
    );
  }
}
