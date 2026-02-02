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
          profile_id
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
    
    let sslStatus = domain.ssl_status || 'pending';
    
    // Check with Vercel - use the domain config endpoint which includes cert info
    if (VERCEL_TOKEN) {
      try {
        // Use the /v6/domains/:domain/config endpoint which includes certificate info
        const configResponse = await fetch(
          `${VERCEL_API_URL}/v6/domains/${domain.full_domain}/config${VERCEL_TEAM_ID ? `?teamId=${VERCEL_TEAM_ID}` : ''}`,
          {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${VERCEL_TOKEN}`,
            },
          }
        );
        
        if (configResponse.ok) {
          const configData = await configResponse.json();
          console.log('[Check SSL] Domain config from Vercel:', configData);
          
          // Check if HTTPS is configured and working
          if (configData.misconfigured === false) {
            // Domain is properly configured with SSL
            sslStatus = 'active';
            console.log('[Check SSL] Domain is properly configured with SSL');
          } else if (configData.misconfigured === true) {
            // Still has issues
            sslStatus = 'pending';
            console.log('[Check SSL] Domain still has configuration issues');
          }
          
          // Also try to check via simple HTTPS request
          try {
            const httpsCheck = await fetch(`https://${domain.full_domain}`, {
              method: 'HEAD',
              redirect: 'manual',
            });
            
            if (httpsCheck.ok || httpsCheck.status === 301 || httpsCheck.status === 302) {
              // HTTPS is working!
              sslStatus = 'active';
              console.log('[Check SSL] HTTPS is working - SSL is active');
            }
          } catch (httpsError) {
            console.log('[Check SSL] HTTPS check failed:', httpsError.message);
          }
        } else {
          console.log('[Check SSL] Config endpoint returned:', configResponse.status);
        }
      } catch (error) {
        console.error('[Check SSL] Vercel API error:', error);
      }
    }
    
    // Update database if status changed
    if (sslStatus !== domain.ssl_status) {
      const updateData = {
        ssl_status: sslStatus,
      };
      
      if (sslStatus === 'active') {
        updateData.ssl_issued_at = new Date().toISOString();
      }
      
      await supabase
        .from('custom_domains')
        .update(updateData)
        .eq('id', domainId);
    }
    
    return NextResponse.json({
      success: true,
      ssl_status: sslStatus,
      updated: sslStatus !== domain.ssl_status,
    });
    
  } catch (error) {
    console.error('[Check SSL] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
