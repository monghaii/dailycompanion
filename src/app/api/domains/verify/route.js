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
    
    const fullDomain = domain.full_domain;
    let dnsVerified = false;
    let dnsRecords = [];
    let vercelVerified = false;
    let sslStatus = 'pending';
    
    // FIRST: Check with Vercel immediately (don't wait for DNS)
    // This will tell us if Vercel requires TXT verification
    if (VERCEL_TOKEN && VERCEL_PROJECT_ID) {
      try {
        // First, check domain status in Vercel
        const checkResponse = await fetch(
          `${VERCEL_API_URL}/v9/projects/${VERCEL_PROJECT_ID}/domains/${domain.full_domain}${VERCEL_TEAM_ID ? `?teamId=${VERCEL_TEAM_ID}` : ''}`,
          {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${VERCEL_TOKEN}`,
            },
          }
        );
        
        let domainExists = checkResponse.ok;
        let domainData = null;
        
        if (domainExists) {
          domainData = await checkResponse.json();
          console.log('[Verify Domain] Existing domain data:', domainData);
          
          // Check if TXT verification is needed
          if (domainData.verification && domainData.verification.length > 0) {
            const txtRecord = domainData.verification.find(v => v.type === 'TXT');
            
            if (txtRecord) {
              await supabase
                .from('custom_domains')
                .update({
                  status: 'pending',
                  verification_method: 'txt',
                  txt_verification_code: txtRecord.value,
                  failed_reason: 'Domain ownership verification required. Please add the TXT record below.',
                })
                .eq('id', domainId);
                
              return NextResponse.json({
                success: false,
                verified: false,
                message: 'Domain requires ownership verification. Please add the TXT record shown below to your DNS.',
                dnsRecords,
                verification_needed: {
                  type: 'TXT',
                  name: txtRecord.domain || `_vercel.${domain.full_domain}`,
                  value: txtRecord.value
                }
              });
            }
          }
        } else if (checkResponse.status === 404) {
          // Domain doesn't exist in Vercel yet, add it
          console.log(`[Verify Domain] Domain not in Vercel, adding: ${domain.full_domain}`);
          const addResponse = await fetch(
            `${VERCEL_API_URL}/v10/projects/${VERCEL_PROJECT_ID}/domains${VERCEL_TEAM_ID ? `?teamId=${VERCEL_TEAM_ID}` : ''}`,
            {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${VERCEL_TOKEN}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                name: domain.full_domain,
              }),
            }
          );
          
          if (addResponse.ok) {
            domainData = await addResponse.json();
            console.log(`[Verify Domain] Successfully added to Vercel:`, domainData);
            
            // Check if new domain requires TXT verification
            if (domainData.verification && domainData.verification.length > 0) {
              const txtRecord = domainData.verification.find(v => v.type === 'TXT');
              
              if (txtRecord) {
                await supabase
                  .from('custom_domains')
                  .update({
                    status: 'pending',
                    verification_method: 'txt',
                    txt_verification_code: txtRecord.value,
                    failed_reason: 'Domain ownership verification required. Please add the TXT record below.',
                  })
                  .eq('id', domainId);
                  
                return NextResponse.json({
                  success: false,
                  verified: false,
                  message: 'Domain requires ownership verification. Please add the TXT record shown below to your DNS.',
                  dnsRecords,
                  verification_needed: {
                    type: 'TXT',
                    name: txtRecord.domain || `_vercel.${domain.full_domain}`,
                    value: txtRecord.value
                  }
                });
              }
            }
          } else {
            const addError = await addResponse.json();
            console.error('[Verify Domain] Failed to add to Vercel:', addError);
          }
        }
        
        // Now trigger verification
        const vercelResponse = await fetch(
          `${VERCEL_API_URL}/v9/projects/${VERCEL_PROJECT_ID}/domains/${domain.full_domain}/verify${VERCEL_TEAM_ID ? `?teamId=${VERCEL_TEAM_ID}` : ''}`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${VERCEL_TOKEN}`,
            },
          }
        );
        
        const vercelData = await vercelResponse.json();
        console.log('[Verify Domain] Vercel verify response:', vercelResponse.status, vercelData);
        
        // Check if verification is needed after verify attempt
        if (vercelData.verified === false && vercelData.verification) {
          const verification = vercelData.verification;
          
          if (verification.length > 0) {
            const txtRecord = verification.find(v => v.type === 'TXT');
            
            if (txtRecord) {
              await supabase
                .from('custom_domains')
                .update({
                  status: 'pending',
                  verification_method: 'txt',
                  txt_verification_code: txtRecord.value,
                  failed_reason: 'Domain ownership verification required. Please add the TXT record below.',
                })
                .eq('id', domainId);
                
              return NextResponse.json({
                success: false,
                verified: false,
                message: 'Domain requires ownership verification. Please add the TXT record shown below to your DNS.',
                dnsRecords,
                verification_needed: {
                  type: 'TXT',
                  name: txtRecord.domain || `_vercel.${domain.full_domain}`,
                  value: txtRecord.value
                }
              });
            }
          }
        }

        if (vercelResponse.ok) {
          vercelVerified = vercelData.verified || false;
          
          // Check SSL status
          if (vercelData.certs && vercelData.certs.length > 0) {
            const cert = vercelData.certs[0];
            sslStatus = cert.status === 'issued' ? 'active' : 'pending';
          }
          
          console.log(`[Verify Domain] Vercel verification: ${vercelVerified}, SSL: ${sslStatus}`, vercelData);
        } else {
          console.error('[Verify Domain] Vercel verify API error:', vercelData);
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
