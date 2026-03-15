import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

export async function GET(request) {
  try {
    // Get auth token from cookies
    const cookieStore = await cookies();
    const authToken = cookieStore.get('auth_token')?.value;
    
    if (!authToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Initialize Supabase client
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    
    // Get user from session
    const { data: session } = await supabase
      .from('sessions')
      .select('user_id')
      .eq('token', authToken)
      .single();
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get coach profile
    const { data: coach, error: coachError } = await supabase
      .from('coaches')
      .select('id')
      .eq('profile_id', session.user_id)
      .single();
    
    if (coachError || !coach) {
      console.error('[Get Clients] Coach not found for profile_id:', session.user_id);
      return NextResponse.json({ error: 'Coach profile not found' }, { status: 404 });
    }
    
    console.log('[Get Clients] Found coach:', coach.id);
    
    // Get all users assigned to this coach (including those without subscriptions)
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, full_name, email, created_at, role')
      .eq('coach_id', coach.id)
      .eq('role', 'user')
      .order('created_at', { ascending: false });
    
    if (profilesError) {
      console.error('[Get Clients] Error fetching profiles:', profilesError);
      return NextResponse.json({ error: 'Failed to fetch clients' }, { status: 500 });
    }
    
    console.log('[Get Clients] Found profiles:', profiles?.length || 0);
    
    if (!profiles || profiles.length === 0) {
      return NextResponse.json({ clients: [] });
    }
    
    // Get subscription data for these users (if they have any)
    const userIds = profiles.map(p => p.id);
    const { data: subscriptions } = await supabase
      .from('user_subscriptions')
      .select('user_id, status, created_at, current_period_start, current_period_end, canceled_at, subscription_tier, sponsored_by_coach_id')
      .in('user_id', userIds);
    
    // Create a map for quick subscription lookup
    const subMap = {};
    if (subscriptions) {
      subscriptions.forEach(sub => {
        subMap[sub.user_id] = sub;
      });
    }

    // Get active sponsorship data for this coach
    const { data: sponsorships } = await supabase
      .from('coach_sponsorships')
      .select('subscription_tier, status, quantity, fee_per_user_cents')
      .eq('coach_id', coach.id);

    const sponsorshipMap = {};
    if (sponsorships) {
      sponsorships.forEach(s => {
        sponsorshipMap[s.subscription_tier] = s;
      });
    }
    
    // Transform data for frontend
    const clients = profiles.map(profile => {
      const subscription = subMap[profile.id];
      return {
        id: profile.id,
        firstName: profile.first_name || '',
        lastName: profile.last_name || '',
        name: profile.full_name || 'Unknown',
        email: profile.email,
        subscriptionStatus: subscription?.status || 'no_subscription',
        subscriptionTier: subscription?.subscription_tier || null,
        subscribedAt: subscription?.created_at || null,
        currentPeriodEnd: subscription?.current_period_end || null,
        canceledAt: subscription?.canceled_at || null,
        userCreatedAt: profile.created_at,
        sponsoredByCoach: subscription?.sponsored_by_coach_id === coach.id,
      };
    });
    
    console.log('[Get Clients] Returning clients:', clients.length);
    
    return NextResponse.json({ clients, sponsorships: sponsorshipMap });
    
  } catch (error) {
    console.error('[Get Clients] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
