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
    
    const { domain } = await request.json();
    
    if (!domain || typeof domain !== 'string') {
      return NextResponse.json({ error: 'Invalid domain' }, { status: 400 });
    }
    
    // Sanitize domain
    const sanitizedDomain = domain.toLowerCase().trim().replace(/^https?:\/\//, '').replace(/\/$/, '');
    
    // Basic domain validation
    const domainRegex = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9][a-z0-9-]{0,61}[a-z0-9]$/;
    if (!domainRegex.test(sanitizedDomain)) {
      return NextResponse.json({ error: 'Invalid domain format. Please enter a valid domain like mycoach.com' }, { status: 400 });
    }
    
    // Get coach profile
    const { data: coach, error: coachError } = await supabase
      .from('coaches')
      .select('id, slug, business_name')
      .eq('profile_id', user.id)
      .single();
    
    if (coachError || !coach) {
      return NextResponse.json({ error: 'Coach profile not found' }, { status: 404 });
    }
    
    // Check if domain already exists
    const { data: existingDomain } = await supabase
      .from('custom_domains')
      .select('id, coach_id')
      .eq('full_domain', sanitizedDomain)
      .single();
    
    if (existingDomain) {
      if (existingDomain.coach_id === coach.id) {
        return NextResponse.json({ error: 'You already added this domain' }, { status: 400 });
      } else {
        return NextResponse.json({ error: 'Domain already claimed by another coach' }, { status: 409 });
      }
    }
    
    // Parse subdomain if present
    const parts = sanitizedDomain.split('.');
    let subdomain = null;
    let rootDomain = sanitizedDomain;
    
    if (parts.length > 2) {
      subdomain = parts.slice(0, -2).join('.');
      rootDomain = parts.slice(-2).join('.');
    }
    
    // Add domain to Vercel via API
    let vercelDomainId = null;
    let vercelConfigured = false;
    
    // Check if Vercel credentials are configured
    if (!VERCEL_TOKEN || !VERCEL_PROJECT_ID) {
      console.warn('[Add Domain] Vercel credentials not configured. Domain will need manual setup.');
    } else {
      try {
        const vercelResponse = await fetch(
          `${VERCEL_API_URL}/v10/projects/${VERCEL_PROJECT_ID}/domains${VERCEL_TEAM_ID ? `?teamId=${VERCEL_TEAM_ID}` : ''}`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${VERCEL_TOKEN}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              name: sanitizedDomain,
            }),
          }
        );
        
        const vercelData = await vercelResponse.json();
        
        if (vercelResponse.ok) {
          vercelDomainId = vercelData.uid || vercelData.name;
          vercelConfigured = true;
          console.log(`[Add Domain] Successfully added to Vercel: ${sanitizedDomain}`, vercelData);
        } else {
          console.error('[Add Domain] Vercel API error:', {
            status: vercelResponse.status,
            statusText: vercelResponse.statusText,
            data: vercelData
          });
          // If domain already exists in Vercel, that's okay
          if (vercelResponse.status === 409 || vercelData.error?.code === 'domain_already_in_use') {
            console.log(`[Add Domain] Domain already exists in Vercel: ${sanitizedDomain}`);
            vercelConfigured = true;
          }
        }
      } catch (vercelError) {
        console.error('[Add Domain] Failed to add to Vercel:', vercelError);
      }
    }
    
    // Get Vercel IP address (check Vercel docs for current IP)
    const vercelIP = process.env.VERCEL_IP_ADDRESS || '76.76.21.21';
    
    // Create database record
    const { data: newDomain, error: insertError } = await supabase
      .from('custom_domains')
      .insert({
        coach_id: coach.id,
        domain: rootDomain,
        subdomain: subdomain,
        status: 'pending',
        vercel_domain_id: vercelDomainId,
        vercel_configured: vercelConfigured,
        expected_a_record: vercelIP,
        verification_method: 'dns',
      })
      .select()
      .single();
    
    if (insertError) {
      console.error('[Add Domain] Database insert error:', insertError);
      return NextResponse.json({ error: 'Failed to save domain' }, { status: 500 });
    }
    
    return NextResponse.json({
      success: true,
      domain: newDomain,
      instructions: {
        type: 'A',
        name: subdomain || '@',
        value: vercelIP,
        ttl: 3600,
      },
    });
    
  } catch (error) {
    console.error('[Add Domain] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
