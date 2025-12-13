import { NextResponse } from 'next/server';
import { createUser, createCoach, generateToken } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { cookies } from 'next/headers';

export async function POST(request) {
  try {
    const body = await request.json();
    const { email, password, fullName, role, slug, businessName } = body;

    // Validate required fields
    if (!email || !password || !fullName) {
      return NextResponse.json(
        { error: 'Email, password, and full name are required' },
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

    // Create user
    const profile = await createUser({
      email,
      password,
      fullName,
      role: role || 'user',
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

