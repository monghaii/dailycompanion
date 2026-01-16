import { NextResponse } from 'next/server';
import { createUser, getCoachBySlug, generateToken } from '@/lib/auth';
import { stripe } from '@/lib/stripe';
import { supabase } from '@/lib/supabase';
import { cookies } from 'next/headers';

const DEV_BYPASS_STRIPE = process.env.DEV_BYPASS_STRIPE?.toLowerCase() === 'true';

export async function POST(request) {
  try {
    const body = await request.json();
    const { email, password, firstName, lastName, coachSlug, plan } = body;

    // Validate input
    if (!email || !password || !firstName || !lastName || !coachSlug || !plan) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }

    // Get coach info
    const coach = await getCoachBySlug(coachSlug);

    if (!coach) {
      return NextResponse.json(
        { error: 'Coach not found' },
        { status: 404 }
      );
    }

    // Skip Stripe checks in dev mode
    if (!DEV_BYPASS_STRIPE) {
      if (!coach.stripe_account_id) {
        return NextResponse.json(
          { error: 'Coach has not set up payments yet' },
          { status: 400 }
        );
      }

      if (!coach.is_active || coach.platform_subscription_status !== 'active') {
        return NextResponse.json(
          { error: 'Coach is not accepting subscriptions at this time' },
          { status: 400 }
        );
      }
    }

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', email.toLowerCase())
      .single();

    if (existingUser) {
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 400 }
      );
    }

    // Create user account (with coach assignment)
    const fullName = `${firstName} ${lastName}`.trim();
    const user = await createUser({
      email,
      password,
      fullName,
      role: 'user',
      coachId: coach.id,
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Failed to create account' },
        { status: 500 }
      );
    }

    // DEV MODE: Bypass Stripe and create mock subscription
    if (DEV_BYPASS_STRIPE) {
      console.log('🚧 DEV MODE: Bypassing Stripe, creating mock subscription');
      
      // Create mock subscription directly in database
      const currentDate = new Date();
      const periodEnd = new Date(currentDate);
      periodEnd.setMonth(periodEnd.getMonth() + (plan === 'yearly' ? 12 : 1));

      await supabase.from('user_subscriptions').insert({
        user_id: user.id,
        coach_id: coach.id,
        stripe_subscription_id: `dev_sub_${user.id.slice(0, 8)}`,
        stripe_customer_id: `dev_cus_${user.id.slice(0, 8)}`,
        status: 'active',
        current_period_start: currentDate.toISOString(),
        current_period_end: periodEnd.toISOString(),
      });

      // Log them in
      const token = generateToken(user.id);
      
      // Store session
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);
      
      await supabase.from('sessions').insert({
        user_id: user.id,
        token,
        expires_at: expiresAt.toISOString(),
      });

      const cookieStore = await cookies();
      cookieStore.set('auth_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 7 days
        path: '/',
      });

      return NextResponse.json({ 
        success: true,
        devMode: true,
        checkoutUrl: `${process.env.NEXT_PUBLIC_APP_URL}/user/dashboard?subscription=success&welcome=true`,
        userId: user.id
      });
    }

    // PRODUCTION MODE: Create Stripe Checkout Session
    // Get platform fee settings
    const { data: platformSettings } = await supabase
      .from('platform_settings')
      .select('key, value')
      .in('key', ['platform_fee_percentage']);

    const platformFeePercentage = platformSettings?.find(
      (s) => s.key === 'platform_fee_percentage'
    )?.value || 20;
    const platformFee = platformFeePercentage / 100;

    // Determine price based on plan
    const priceInCents = plan === 'yearly' 
      ? coach.user_yearly_price_cents 
      : coach.user_monthly_price_cents;

    const interval = plan === 'yearly' ? 'year' : 'month';

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      customer_email: email,
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `${coach.business_name} Subscription`,
              description: `${plan === 'yearly' ? 'Annual' : 'Monthly'} subscription to ${coach.business_name}`,
            },
            unit_amount: priceInCents,
            recurring: {
              interval,
            },
          },
          quantity: 1,
        },
      ],
      payment_intent_data: {
        application_fee_amount: Math.round(priceInCents * platformFee),
        transfer_data: {
          destination: coach.stripe_account_id,
        },
      },
      subscription_data: {
        application_fee_percent: platformFeePercentage,
        transfer_data: {
          destination: coach.stripe_account_id,
        },
      },
      metadata: {
        userId: user.id,
        coachId: coach.id,
        type: 'user_subscription',
      },
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/user/dashboard?subscription=success&welcome=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/coach/${coachSlug}?subscription=canceled`,
    });

    return NextResponse.json({ 
      success: true,
      devMode: false,
      checkoutUrl: session.url,
      userId: user.id
    });
  } catch (error) {
    console.error('Signup with payment error:', error);
    
    // Provide more specific error messages
    if (error.message?.includes('already exists')) {
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create account. Please try again.' },
      { status: 500 }
    );
  }
}

