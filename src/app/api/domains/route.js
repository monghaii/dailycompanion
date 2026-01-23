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
    
    const user = { id: session.user_id };
    
    // Get coach profile
    const { data: coach, error: coachError } = await supabase
      .from('coaches')
      .select('id')
      .eq('profile_id', user.id)
      .single();
    
    if (coachError || !coach) {
      return NextResponse.json({ error: 'Coach profile not found' }, { status: 404 });
    }
    
    // Get all domains for this coach
    const { data: domains, error: domainsError } = await supabase
      .from('custom_domains')
      .select('*')
      .eq('coach_id', coach.id)
      .order('created_at', { ascending: false });
    
    if (domainsError) {
      console.error('[Get Domains] Error:', domainsError);
      return NextResponse.json({ error: 'Failed to fetch domains' }, { status: 500 });
    }
    
    return NextResponse.json({ domains: domains || [] });
    
  } catch (error) {
    console.error('[Get Domains] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
