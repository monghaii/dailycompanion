import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { supabase } from '@/lib/supabase';

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(request) {
  try {
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    let event;

    if (webhookSecret) {
      try {
        event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
      } catch (err) {
        console.error('Webhook signature verification failed:', err.message);
        return NextResponse.json(
          { error: 'Invalid signature' },
          { status: 400 }
        );
      }
    } else {
      // For development without webhook secret
      event = JSON.parse(body);
    }

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        
        if (session.metadata?.type === 'coach_subscription') {
          // Coach subscribed to platform
          await supabase
            .from('coaches')
            .update({
              platform_subscription_status: 'active',
              platform_subscription_id: session.subscription,
              is_active: true,
            })
            .eq('id', session.metadata.coachId);
        } else if (session.metadata?.type === 'user_subscription') {
          // User subscribed to coach
          await supabase.from('user_subscriptions').upsert({
            user_id: session.metadata.userId,
            coach_id: session.metadata.coachId,
            stripe_subscription_id: session.subscription,
            stripe_customer_id: session.customer,
            status: 'active',
            current_period_start: new Date().toISOString(),
          });
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object;
        
        // Check if it's a coach or user subscription
        const { data: coach } = await supabase
          .from('coaches')
          .select('id')
          .eq('platform_subscription_id', subscription.id)
          .single();

        if (coach) {
          // Update coach subscription status
          await supabase
            .from('coaches')
            .update({
              platform_subscription_status: subscription.status,
              platform_subscription_ends_at: subscription.current_period_end
                ? new Date(subscription.current_period_end * 1000).toISOString()
                : null,
              is_active: subscription.status === 'active',
            })
            .eq('id', coach.id);
        } else {
          // Update user subscription status
          await supabase
            .from('user_subscriptions')
            .update({
              status: subscription.status,
              current_period_start: subscription.current_period_start
                ? new Date(subscription.current_period_start * 1000).toISOString()
                : null,
              current_period_end: subscription.current_period_end
                ? new Date(subscription.current_period_end * 1000).toISOString()
                : null,
            })
            .eq('stripe_subscription_id', subscription.id);
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object;

        // Check if it's a coach subscription
        const { data: coach } = await supabase
          .from('coaches')
          .select('id')
          .eq('platform_subscription_id', subscription.id)
          .single();

        if (coach) {
          await supabase
            .from('coaches')
            .update({
              platform_subscription_status: 'canceled',
              is_active: false,
            })
            .eq('id', coach.id);
        } else {
          await supabase
            .from('user_subscriptions')
            .update({
              status: 'canceled',
              canceled_at: new Date().toISOString(),
            })
            .eq('stripe_subscription_id', subscription.id);
        }
        break;
      }

      case 'account.updated': {
        // Stripe Connect account updated
        const account = event.data.object;
        
        if (account.metadata?.coachId) {
          const isActive = account.charges_enabled && account.payouts_enabled;
          
          await supabase
            .from('coaches')
            .update({
              stripe_account_status: isActive ? 'active' : 'pending',
            })
            .eq('id', account.metadata.coachId);
        }
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}

