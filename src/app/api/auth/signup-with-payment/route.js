import { NextResponse } from 'next/server';
import { createUser, getCoachBySlug, generateToken } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { cookies } from 'next/headers';
import { trackServerEvent, identifyUser } from '@/lib/posthog';

export async function POST(request) {
  try {
    const body = await request.json();
    const { email, password, firstName, lastName, coachSlug } = body;

    // Validate input
    if (!email || !password || !firstName || !lastName || !coachSlug) {
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
    // Default token_limit to 0 for free users
    const fullName = `${firstName} ${lastName}`.trim();
    const user = await createUser({
      email,
      password,
      fullName,
      role: 'user',
      coachId: coach.id,
      tokenLimit: 0, // Explicitly set 0 for free tier
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Failed to create account' },
        { status: 500 }
      );
    }

    // Log them in
    const token = generateToken(user.id);
    
    // Store session
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    
    const { error: sessionError } = await supabase.from('sessions').insert({
      user_id: user.id,
      token,
      expires_at: expiresAt.toISOString(),
    });
    
    if (sessionError) {
      console.error('Session creation error:', sessionError);
      return NextResponse.json(
        { error: 'Failed to create database session: ' + sessionError.message },
        { status: 500 }
      );
    }

    const cookieStore = await cookies();
    cookieStore.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });

    // Track signup in PostHog
    identifyUser(user.id, {
      email,
      role: 'user',
      first_name: firstName,
      last_name: lastName,
      coach_id: coach.id,
      coach_slug: coachSlug,
    });
    trackServerEvent(user.id, 'user_signed_up', {
      coach_id: coach.id,
      coach_slug: coachSlug,
      plan: 'free',
    });

    // User created as FREE - they can upgrade later from Settings
    return NextResponse.json({ 
      success: true,
      userId: user.id,
      message: 'Account created successfully'
    });
  } catch (error) {
    console.error('Signup error:', error);
    
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

