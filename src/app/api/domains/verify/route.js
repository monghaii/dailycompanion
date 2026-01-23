import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import dns from 'dns/promises';

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
    
    // Update status to verifying
    await supabase
      .from('custom_domains')
      .update({
        status: 'verifying',
        last_verification_attempt: new Date().toISOString(),
        verification_attempts: domain.verification_attempts + 1,
      })
      .eq('id', domainId);
    
    // Perform DNS lookup
    const fullDomain = domain.full_domain;
    let dnsVerified = false;
    let dnsRecords = [];
    
    try {
      const records = await dns.resolve4(fullDomain);
      dnsRecords = records;
      
      // Check if any record matches expected IP
      const expectedIP = domain.expected_a_record;
      dnsVerified = records.some(ip => ip === expectedIP);
      
      console.log(`[Verify Domain] DNS records for ${fullDomain}:`, records);
      console.log(`[Verify Domain] Expected IP: ${expectedIP}, Found: ${dnsVerified}`);
      
    } catch (dnsError) {
      console.error(`[Verify Domain] DNS lookup failed for ${fullDomain}:`, dnsError);
      
      await supabase
        .from('custom_domains')
        .update({
          status: 'failed',
          failed_reason: 'DNS record not found or incorrect',
        })
        .eq('id', domainId);
      
      return NextResponse.json({
        success: false,
        verified: false,
        message: 'DNS record not found. Please ensure you\'ve added the A record and waited for DNS propagation (can take up to 48 hours).',
        dnsRecords: [],
      });
    }
    
    if (!dnsVerified) {
      await supabase
        .from('custom_domains')
        .update({
          status: 'failed',
          failed_reason: `DNS record points to ${dnsRecords.join(', ')} instead of ${domain.expected_a_record}`,
        })
        .eq('id', domainId);
      
      return NextResponse.json({
        success: false,
        verified: false,
        message: `DNS record found but points to incorrect IP. Expected: ${domain.expected_a_record}, Found: ${dnsRecords.join(', ')}`,
        dnsRecords,
      });
    }
    
    // DNS verified! Now verify with Vercel
    let vercelVerified = false;
    let sslStatus = 'pending';
    
    if (domain.vercel_domain_id && VERCEL_TOKEN && VERCEL_PROJECT_ID) {
      try {
        const vercelResponse = await fetch(
          `${VERCEL_API_URL}/v9/projects/${VERCEL_PROJECT_ID}/domains/${domain.full_domain}${VERCEL_TEAM_ID ? `?teamId=${VERCEL_TEAM_ID}` : ''}`,
          {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${VERCEL_TOKEN}`,
            },
          }
        );
        
        const vercelData = await vercelResponse.json();
        
        if (vercelResponse.ok) {
          vercelVerified = vercelData.verified || false;
          
          // Check SSL status
          if (vercelData.certs && vercelData.certs.length > 0) {
            const cert = vercelData.certs[0];
            sslStatus = cert.status === 'issued' ? 'active' : 'pending';
          }
          
          console.log(`[Verify Domain] Vercel verification: ${vercelVerified}, SSL: ${sslStatus}`);
        }
      } catch (vercelError) {
        console.error('[Verify Domain] Vercel API error:', vercelError);
      }
    }
    
    // Update domain record
    const updateData = {
      status: 'verified',
      verified_at: new Date().toISOString(),
      ssl_status: sslStatus,
      failed_reason: null,
    };
    
    if (sslStatus === 'active') {
      updateData.ssl_issued_at = new Date().toISOString();
    }
    
    await supabase
      .from('custom_domains')
      .update(updateData)
      .eq('id', domainId);
    
    // Update coach's primary domain
    await supabase
      .from('coaches')
      .update({
        custom_domain_enabled: true,
        primary_domain: fullDomain,
      })
      .eq('id', domain.coach_id);
    
    return NextResponse.json({
      success: true,
      verified: true,
      message: 'Domain successfully verified!',
      ssl_status: sslStatus,
      ssl_message: sslStatus === 'active' 
        ? 'SSL certificate is active. Your domain is ready!' 
        : 'SSL certificate is being issued. This may take a few minutes.',
      dnsRecords,
    });
    
  } catch (error) {
    console.error('[Verify Domain] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
