import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { stripe } from '@/lib/stripe';
import { supabase } from '@/lib/supabase';

export async function POST() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Check if user is a test premium user
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_test_premium')
      .eq('id', user.id)
      .single();

    if (profile?.is_test_premium) {
      // Disable test premium flag
      await supabase
        .from('profiles')
        .update({ is_test_premium: false })
        .eq('id', user.id);
        
      // We continue to cancel the subscription record below if it exists
      // This ensures we fall back to the subscription's natural expiration
    }

    // Get user's subscription
    const { data: subscription, error: subError } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single();

    if (subError || !subscription) {
      return NextResponse.json(
        { error: 'No active subscription found' },
        { status: 404 }
      );
    }

    // Cancel in Stripe if subscription ID exists
    if (subscription.stripe_subscription_id) {
      try {
        await stripe.subscriptions.update(subscription.stripe_subscription_id, {
          cancel_at_period_end: true,
        });
      } catch (stripeError) {
        console.error('Stripe cancellation error:', stripeError);
        // Continue anyway - we'll update our database
      }
    }

    // Update database - don't immediately cancel, keep until period end
    const { error: updateError } = await supabase
      .from('user_subscriptions')
      .update({
        canceled_at: new Date().toISOString(),
        // Status stays 'active' until period ends (webhook will update it)
      })
      .eq('id', subscription.id);

    if (updateError) {
      console.error('Database update error:', updateError);
      return NextResponse.json(
        { error: 'Failed to cancel subscription' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Subscription will be canceled at the end of your billing period',
      access_until: subscription.current_period_end,
    });
  } catch (error) {
    console.error('Cancel subscription error:', error);
    return NextResponse.json(
      { error: 'Failed to cancel subscription' },
      { status: 500 }
    );
  }
}
