import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

const VERCEL_API_URL = 'https://api.vercel.com';
const VERCEL_TOKEN = process.env.VERCEL_TOKEN;
const VERCEL_PROJECT_ID = process.env.VERCEL_PROJECT_ID;
const VERCEL_TEAM_ID = process.env.VERCEL_TEAM_ID;

export async function POST(request) {
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
    
    const { domainId } = await request.json();
    
    if (!domainId) {
      return NextResponse.json({ error: 'Domain ID required' }, { status: 400 });
    }
    
    // Get domain record
    const { data: domain, error: domainError } = await supabase
      .from('custom_domains')
      .select(`
        *,
        coaches (
          id,
          profile_id,
          primary_domain
        )
      `)
      .eq('id', domainId)
      .single();
    
    if (domainError || !domain) {
      return NextResponse.json({ error: 'Domain not found' }, { status: 404 });
    }
    
    // Verify ownership
    if (domain.coaches.profile_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
    
    // Remove from Vercel if configured
    if (domain.vercel_configured && domain.full_domain && VERCEL_TOKEN && VERCEL_PROJECT_ID) {
      try {
        const vercelResponse = await fetch(
          `${VERCEL_API_URL}/v9/projects/${VERCEL_PROJECT_ID}/domains/${domain.full_domain}${VERCEL_TEAM_ID ? `?teamId=${VERCEL_TEAM_ID}` : ''}`,
          {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${VERCEL_TOKEN}`,
            },
          }
        );
        
        if (vercelResponse.ok) {
          console.log(`[Remove Domain] Successfully removed from Vercel: ${domain.full_domain}`);
        } else {
          console.error('[Remove Domain] Vercel API error:', await vercelResponse.json());
        }
      } catch (vercelError) {
        console.error('[Remove Domain] Failed to remove from Vercel:', vercelError);
      }
    }
    
    // Delete from database
    const { error: deleteError } = await supabase
      .from('custom_domains')
      .delete()
      .eq('id', domainId);
    
    if (deleteError) {
      console.error('[Remove Domain] Database delete error:', deleteError);
      return NextResponse.json({ error: 'Failed to remove domain' }, { status: 500 });
    }
    
    // Update coach's primary domain if this was it
    if (domain.coaches.primary_domain === domain.full_domain) {
      await supabase
        .from('coaches')
        .update({
          custom_domain_enabled: false,
          primary_domain: null,
        })
        .eq('id', domain.coach_id);
    }
    
    return NextResponse.json({ success: true, message: 'Domain removed successfully' });
    
  } catch (error) {
    console.error('[Remove Domain] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
