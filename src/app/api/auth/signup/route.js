import { NextResponse } from 'next/server';
import { createUser, createCoach, generateToken } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { cookies } from 'next/headers';
import { trackServerEvent, identifyUser } from '@/lib/posthog';

export async function POST(request) {
  try {
    const body = await request.json();
    const { email, password, fullName, firstName, lastName, role, slug, businessName, coachSlug } = body;

    const resolvedFirst = firstName || "";
    const resolvedLast = lastName || "";
    const resolvedFull = fullName || `${resolvedFirst} ${resolvedLast}`.trim();

    if (!email || !password || (!resolvedFull && !resolvedFirst)) {
      return NextResponse.json(
        { error: 'Email, password, and name are required' },
        { status: 400 }
      );
    }

    // Additional validation for coaches
    if (role === 'coach' && (!slug || !businessName)) {
      return NextResponse.json(
        { error: 'Coaches must provide a URL slug and business name' },
        { status: 400 }
      );
    }

    // If signing up through a coach's URL, get the coach_id
    let coachId = null;
    if (coachSlug && role !== 'coach') {
      const { data: coach } = await supabase
        .from('coaches')
        .select('id')
        .eq('slug', coachSlug)
        .single();
      
      if (coach) {
        coachId = coach.id;
      }
    }

    // Create user
    const profile = await createUser({
      email,
      password,
      fullName: resolvedFull,
      firstName: resolvedFirst,
      lastName: resolvedLast,
      role: role || 'user',
      coachId,
    });

    // If coach, create coach record
    let coach = null;
    if (role === 'coach') {
      coach = await createCoach({
        profileId: profile.id,
        slug: slug.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
        businessName,
      });
    }

    // Generate token and set cookie
    const token = generateToken(profile.id);
    
    // Store session
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    
    await supabase.from('sessions').insert({
      user_id: profile.id,
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

    // Track signup in PostHog
    const eventName = role === 'coach' ? 'coach_signed_up' : 'user_signed_up';
    identifyUser(profile.id, {
      email,
      role: role || 'user',
      first_name: resolvedFirst,
      last_name: resolvedLast,
      coach_id: coachId || undefined,
    });
    trackServerEvent(profile.id, eventName, {
      coach_id: coachId || undefined,
      coach_slug: role === 'coach' ? slug : coachSlug,
      plan: 'free',
    });

    return NextResponse.json({
      success: true,
      profile,
      coach,
      requiresSubscription: role === 'coach',
    });
  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create account' },
      { status: 400 }
    );
  }
}

