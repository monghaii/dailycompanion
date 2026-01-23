# Custom Domain Feature - Daily Companion

## Overview

Allow coaches to connect their own custom domains (e.g., `mycoach.com`) to serve their landing page and user experience, while maintaining `dailycompanion.app` as the platform's primary domain.

### User Experience

**Current Flow:**
```
dailycompanion.app → Platform landing page (for coaches)
dailycompanion.app/coach/brainpeace → Coach's landing page
dailycompanion.app/user/dashboard → User dashboard
```

**New Flow with Custom Domain:**
```
mycoach.com → Coach's landing page (automatically)
mycoach.com/user/dashboard → User dashboard (coach-branded)
dailycompanion.app → Platform landing page (unchanged)
dailycompanion.app/coach/brainpeace → Coach's landing page (still works)
```

---

## Architecture Overview

### Components

1. **Domain Detection Middleware** - Detects custom domains and maps to coaches
2. **Vercel Domain API Integration** - Adds/verifies domains programmatically
3. **Database Schema** - Stores domain-to-coach mappings
4. **Settings Wizard UI** - Guides coaches through domain setup
5. **DNS Validation** - Checks if DNS records are configured correctly

### Technology Stack

- **Vercel Domains API** - Programmatic domain management
- **Next.js Middleware** - Request interception and routing
- **Vercel Edge Config** (optional) - Fast domain lookups at the edge
- **DNS Verification** - Node.js `dns` module or external API

---

## Database Schema

### New Table: `custom_domains`

```sql
CREATE TABLE IF NOT EXISTS custom_domains (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  coach_id UUID NOT NULL REFERENCES coaches(id) ON DELETE CASCADE,
  
  -- Domain information
  domain TEXT NOT NULL UNIQUE, -- e.g., 'mycoach.com'
  subdomain TEXT, -- e.g., 'coaching' if using 'coaching.mycompany.com'
  full_domain TEXT GENERATED ALWAYS AS (
    CASE 
      WHEN subdomain IS NOT NULL THEN subdomain || '.' || domain
      ELSE domain
    END
  ) STORED,
  
  -- Verification status
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'verifying', 'verified', 'failed', 'disabled'
  verification_method TEXT DEFAULT 'dns', -- 'dns', 'txt', 'cname'
  
  -- Vercel integration
  vercel_domain_id TEXT, -- Vercel's domain ID
  vercel_configured BOOLEAN DEFAULT false,
  
  -- DNS records for verification
  expected_a_record TEXT, -- IP address to point to
  expected_cname_record TEXT, -- CNAME target if using subdomain
  txt_verification_code TEXT, -- Optional TXT record for verification
  
  -- Verification attempts
  last_verification_attempt TIMESTAMPTZ,
  verification_attempts INTEGER DEFAULT 0,
  verified_at TIMESTAMPTZ,
  failed_reason TEXT,
  
  -- SSL status
  ssl_status TEXT DEFAULT 'pending', -- 'pending', 'active', 'failed'
  ssl_issued_at TIMESTAMPTZ,
  
  -- Metadata
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_status CHECK (status IN ('pending', 'verifying', 'verified', 'failed', 'disabled')),
  CONSTRAINT valid_ssl_status CHECK (ssl_status IN ('pending', 'active', 'failed'))
);

-- Indexes
CREATE INDEX idx_custom_domains_coach_id ON custom_domains(coach_id);
CREATE INDEX idx_custom_domains_full_domain ON custom_domains(full_domain);
CREATE INDEX idx_custom_domains_status ON custom_domains(status);
CREATE UNIQUE INDEX idx_custom_domains_active_domain ON custom_domains(full_domain) WHERE is_active = true;

-- Add column to coaches table
ALTER TABLE coaches ADD COLUMN IF NOT EXISTS custom_domain_enabled BOOLEAN DEFAULT false;
ALTER TABLE coaches ADD COLUMN IF NOT EXISTS primary_domain TEXT; -- Points to custom_domains.full_domain
```

---

## Vercel Configuration

### Environment Variables

```env
# Vercel API
VERCEL_TOKEN=your_vercel_token_here
VERCEL_TEAM_ID=team_xxx (if using team account)
VERCEL_PROJECT_ID=prj_xxx

# Domain Configuration
PLATFORM_DOMAIN=dailycompanion.app
VERCEL_IP_ADDRESS=76.76.21.21  # Vercel's IP (check Vercel docs for current IP)
```

### Getting Vercel Token

1. Go to https://vercel.com/account/tokens
2. Create a new token with permissions:
   - `domains:read`
   - `domains:write`
   - `projects:read`

---

## Implementation

### 1. Next.js Middleware (Domain Detection)

**`src/middleware.js`**

```javascript
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function middleware(request) {
  const { pathname, hostname } = request.nextUrl;
  
  // Platform domain - no modifications needed
  const platformDomain = process.env.PLATFORM_DOMAIN || 'dailycompanion.app';
  const isLocalhost = hostname === 'localhost' || hostname.includes('127.0.0.1');
  
  // If on platform domain or localhost, proceed normally
  if (hostname === platformDomain || isLocalhost) {
    return NextResponse.next();
  }
  
  // Custom domain detected - look up associated coach
  console.log(`[Middleware] Custom domain detected: ${hostname}`);
  
  try {
    const { data: customDomain, error } = await supabase
      .from('custom_domains')
      .select(`
        id,
        coach_id,
        full_domain,
        status,
        coaches (
          id,
          slug,
          business_name,
          is_active
        )
      `)
      .eq('full_domain', hostname)
      .eq('is_active', true)
      .eq('status', 'verified')
      .single();
    
    if (error || !customDomain) {
      console.log(`[Middleware] Domain not found or not verified: ${hostname}`);
      // Show a "domain not configured" page
      return NextResponse.rewrite(new URL('/domain-not-configured', request.url));
    }
    
    const coach = customDomain.coaches;
    
    if (!coach || !coach.is_active) {
      console.log(`[Middleware] Coach not active for domain: ${hostname}`);
      return NextResponse.rewrite(new URL('/domain-not-configured', request.url));
    }
    
    // Handle routing based on path
    console.log(`[Middleware] Routing ${pathname} for coach: ${coach.slug}`);
    
    // Root path → Coach's landing page
    if (pathname === '/' || pathname === '') {
      const url = new URL(`/coach/${coach.slug}`, request.url);
      const response = NextResponse.rewrite(url);
      
      // Add custom header to identify custom domain context
      response.headers.set('X-Custom-Domain', hostname);
      response.headers.set('X-Coach-Slug', coach.slug);
      response.headers.set('X-Coach-Id', coach.id);
      
      return response;
    }
    
    // Already has /coach/ prefix → strip it to avoid duplication
    if (pathname.startsWith('/coach/')) {
      const newPath = pathname.replace(`/coach/${coach.slug}`, '');
      const url = new URL(newPath || '/', request.url);
      const response = NextResponse.rewrite(url);
      
      response.headers.set('X-Custom-Domain', hostname);
      response.headers.set('X-Coach-Slug', coach.slug);
      response.headers.set('X-Coach-Id', coach.id);
      
      return response;
    }
    
    // User dashboard, login, signup → keep as is but add context
    if (pathname.startsWith('/user/') || pathname.startsWith('/login') || pathname.startsWith('/signup')) {
      const response = NextResponse.next();
      
      response.headers.set('X-Custom-Domain', hostname);
      response.headers.set('X-Coach-Slug', coach.slug);
      response.headers.set('X-Coach-Id', coach.id);
      
      return response;
    }
    
    // All other paths → serve normally with custom domain context
    const response = NextResponse.next();
    
    response.headers.set('X-Custom-Domain', hostname);
    response.headers.set('X-Coach-Slug', coach.slug);
    response.headers.set('X-Coach-Id', coach.id);
    
    return response;
    
  } catch (err) {
    console.error('[Middleware] Error processing custom domain:', err);
    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
```

### 2. API Routes

#### A. Add Custom Domain

**`src/app/api/domains/add/route.js`**

```javascript
import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

const VERCEL_API_URL = 'https://api.vercel.com';
const VERCEL_TOKEN = process.env.VERCEL_TOKEN;
const VERCEL_PROJECT_ID = process.env.VERCEL_PROJECT_ID;
const VERCEL_TEAM_ID = process.env.VERCEL_TEAM_ID;

export async function POST(request) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { domain } = await request.json();
    
    if (!domain || typeof domain !== 'string') {
      return NextResponse.json({ error: 'Invalid domain' }, { status: 400 });
    }
    
    // Sanitize domain
    const sanitizedDomain = domain.toLowerCase().trim().replace(/^https?:\/\//, '').replace(/\/$/, '');
    
    // Basic domain validation
    const domainRegex = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9][a-z0-9-]{0,61}[a-z0-9]$/;
    if (!domainRegex.test(sanitizedDomain)) {
      return NextResponse.json({ error: 'Invalid domain format' }, { status: 400 });
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
        vercelDomainId = vercelData.uid;
        vercelConfigured = true;
        console.log(`[Add Domain] Successfully added to Vercel: ${sanitizedDomain}`);
      } else {
        console.error('[Add Domain] Vercel API error:', vercelData);
        // Continue anyway - manual configuration possible
      }
    } catch (vercelError) {
      console.error('[Add Domain] Failed to add to Vercel:', vercelError);
      // Continue anyway - manual configuration possible
    }
    
    // Get Vercel IP address
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
```

#### B. Verify Domain

**`src/app/api/domains/verify/route.js`**

```javascript
import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import dns from 'dns/promises';

const VERCEL_API_URL = 'https://api.vercel.com';
const VERCEL_TOKEN = process.env.VERCEL_TOKEN;
const VERCEL_PROJECT_ID = process.env.VERCEL_PROJECT_ID;
const VERCEL_TEAM_ID = process.env.VERCEL_TEAM_ID;

export async function POST(request) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
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
    
    if (domain.vercel_domain_id) {
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
```

#### C. Get Coach Domains

**`src/app/api/domains/route.js`**

```javascript
import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function GET(request) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
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
```

#### D. Remove Domain

**`src/app/api/domains/remove/route.js`**

```javascript
import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

const VERCEL_API_URL = 'https://api.vercel.com';
const VERCEL_TOKEN = process.env.VERCEL_TOKEN;
const VERCEL_PROJECT_ID = process.env.VERCEL_PROJECT_ID;
const VERCEL_TEAM_ID = process.env.VERCEL_TEAM_ID;

export async function POST(request) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
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
    
    // Remove from Vercel if configured
    if (domain.vercel_configured && domain.full_domain) {
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
```

---

## UI Components

### Domain Setup Wizard

**`src/app/dashboard/components/CustomDomainWizard.js`**

```javascript
'use client';

import { useState, useEffect } from 'react';

export default function CustomDomainWizard() {
  const [domains, setDomains] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newDomain, setNewDomain] = useState('');
  const [adding, setAdding] = useState(false);
  const [verifying, setVerifying] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchDomains();
  }, []);

  async function fetchDomains() {
    try {
      const res = await fetch('/api/domains');
      const data = await res.json();
      if (res.ok) {
        setDomains(data.domains);
      }
    } catch (err) {
      console.error('Failed to fetch domains:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleAddDomain() {
    if (!newDomain.trim()) {
      setError('Please enter a domain');
      return;
    }

    setAdding(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetch('/api/domains/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain: newDomain }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to add domain');
        return;
      }

      setSuccess('Domain added! Follow the instructions below to verify.');
      setNewDomain('');
      setShowAddModal(false);
      fetchDomains();
    } catch (err) {
      setError('Failed to add domain');
    } finally {
      setAdding(false);
    }
  }

  async function handleVerifyDomain(domainId) {
    setVerifying(domainId);
    setError('');
    setSuccess('');

    try {
      const res = await fetch('/api/domains/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domainId }),
      });

      const data = await res.json();

      if (data.verified) {
        setSuccess(data.message);
        fetchDomains();
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('Failed to verify domain');
    } finally {
      setVerifying(null);
    }
  }

  async function handleRemoveDomain(domainId) {
    if (!confirm('Are you sure you want to remove this domain?')) {
      return;
    }

    try {
      const res = await fetch('/api/domains/remove', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domainId }),
      });

      if (res.ok) {
        setSuccess('Domain removed successfully');
        fetchDomains();
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to remove domain');
      }
    } catch (err) {
      setError('Failed to remove domain');
    }
  }

  function getStatusBadge(status, sslStatus) {
    const badges = {
      pending: { bg: '#FEF3C7', color: '#92400E', text: 'Pending Setup' },
      verifying: { bg: '#DBEAFE', color: '#1E40AF', text: 'Verifying...' },
      verified: { bg: '#D1FAE5', color: '#065F46', text: 'Verified ✓' },
      failed: { bg: '#FEE2E2', color: '#991B1B', text: 'Failed' },
      disabled: { bg: '#F3F4F6', color: '#6B7280', text: 'Disabled' },
    };

    const badge = badges[status] || badges.pending;
    
    return (
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        <span
          style={{
            display: 'inline-block',
            padding: '4px 12px',
            borderRadius: '12px',
            fontSize: '12px',
            fontWeight: '600',
            backgroundColor: badge.bg,
            color: badge.color,
          }}
        >
          {badge.text}
        </span>
        {status === 'verified' && (
          <span
            style={{
              display: 'inline-block',
              padding: '4px 12px',
              borderRadius: '12px',
              fontSize: '12px',
              fontWeight: '600',
              backgroundColor: sslStatus === 'active' ? '#D1FAE5' : '#FEF3C7',
              color: sslStatus === 'active' ? '#065F46' : '#92400E',
            }}
          >
            {sslStatus === 'active' ? 'SSL Active 🔒' : 'SSL Pending'}
          </span>
        )}
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <div style={{ fontSize: '24px' }}>Loading domains...</div>
      </div>
    );
  }

  return (
    <div style={{ padding: '40px' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '32px' }}>
          <h2 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '8px' }}>
            Custom Domain
          </h2>
          <p style={{ color: '#6B7280', fontSize: '16px' }}>
            Connect your own domain to serve your coaching landing page and user experience.
          </p>
        </div>

        {/* Alerts */}
        {error && (
          <div
            style={{
              padding: '16px',
              marginBottom: '24px',
              backgroundColor: '#FEE2E2',
              color: '#991B1B',
              borderRadius: '8px',
              border: '1px solid #FCA5A5',
            }}
          >
            {error}
          </div>
        )}

        {success && (
          <div
            style={{
              padding: '16px',
              marginBottom: '24px',
              backgroundColor: '#D1FAE5',
              color: '#065F46',
              borderRadius: '8px',
              border: '1px solid #6EE7B7',
            }}
          >
            {success}
          </div>
        )}

        {/* Add Domain Button */}
        {domains.length === 0 ? (
          <div
            style={{
              padding: '60px',
              textAlign: 'center',
              backgroundColor: '#F9FAFB',
              borderRadius: '12px',
              border: '2px dashed #D1D5DB',
            }}
          >
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🌐</div>
            <h3 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '8px' }}>
              No custom domain configured
            </h3>
            <p style={{ color: '#6B7280', marginBottom: '24px' }}>
              Add your custom domain to get started
            </p>
            <button
              onClick={() => setShowAddModal(true)}
              style={{
                padding: '12px 24px',
                backgroundColor: '#3B82F6',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
              }}
            >
              + Add Custom Domain
            </button>
          </div>
        ) : (
          <div>
            <button
              onClick={() => setShowAddModal(true)}
              style={{
                padding: '12px 24px',
                backgroundColor: '#3B82F6',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
                marginBottom: '24px',
              }}
            >
              + Add Another Domain
            </button>

            {/* Domains List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {domains.map((domain) => (
                <div
                  key={domain.id}
                  style={{
                    padding: '24px',
                    backgroundColor: 'white',
                    borderRadius: '12px',
                    border: '1px solid #E5E7EB',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                    <div>
                      <h3 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '8px' }}>
                        {domain.full_domain}
                      </h3>
                      {getStatusBadge(domain.status, domain.ssl_status)}
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      {domain.status === 'pending' || domain.status === 'failed' ? (
                        <button
                          onClick={() => handleVerifyDomain(domain.id)}
                          disabled={verifying === domain.id}
                          style={{
                            padding: '8px 16px',
                            backgroundColor: verifying === domain.id ? '#9CA3AF' : '#10B981',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            fontSize: '14px',
                            fontWeight: '600',
                            cursor: verifying === domain.id ? 'not-allowed' : 'pointer',
                          }}
                        >
                          {verifying === domain.id ? 'Verifying...' : 'Verify'}
                        </button>
                      ) : null}
                      <button
                        onClick={() => handleRemoveDomain(domain.id)}
                        style={{
                          padding: '8px 16px',
                          backgroundColor: '#EF4444',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          fontSize: '14px',
                          fontWeight: '600',
                          cursor: 'pointer',
                        }}
                      >
                        Remove
                      </button>
                    </div>
                  </div>

                  {domain.status === 'pending' || domain.status === 'failed' ? (
                    <div
                      style={{
                        padding: '16px',
                        backgroundColor: '#F3F4F6',
                        borderRadius: '8px',
                        marginTop: '16px',
                      }}
                    >
                      <h4 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px' }}>
                        📋 DNS Configuration Instructions
                      </h4>
                      <p style={{ fontSize: '14px', color: '#6B7280', marginBottom: '16px' }}>
                        Add the following DNS record to your domain provider:
                      </p>
                      <div
                        style={{
                          padding: '12px',
                          backgroundColor: '#1F2937',
                          color: '#10B981',
                          borderRadius: '6px',
                          fontFamily: 'monospace',
                          fontSize: '14px',
                        }}
                      >
                        <div>Type: <span style={{ color: 'white' }}>A</span></div>
                        <div>Name: <span style={{ color: 'white' }}>{domain.subdomain || '@'}</span></div>
                        <div>Value: <span style={{ color: 'white' }}>{domain.expected_a_record}</span></div>
                        <div>TTL: <span style={{ color: 'white' }}>3600</span></div>
                      </div>
                      <p style={{ fontSize: '12px', color: '#9CA3AF', marginTop: '12px' }}>
                        ⏱️ DNS propagation can take up to 48 hours. Click "Verify" to check status.
                      </p>
                      {domain.failed_reason && (
                        <div
                          style={{
                            marginTop: '12px',
                            padding: '12px',
                            backgroundColor: '#FEE2E2',
                            color: '#991B1B',
                            borderRadius: '6px',
                            fontSize: '14px',
                          }}
                        >
                          ❌ {domain.failed_reason}
                        </div>
                      )}
                    </div>
                  ) : domain.status === 'verified' ? (
                    <div
                      style={{
                        padding: '16px',
                        backgroundColor: '#ECFDF5',
                        borderRadius: '8px',
                        marginTop: '16px',
                      }}
                    >
                      <h4 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '8px', color: '#065F46' }}>
                        ✅ Domain Active!
                      </h4>
                      <p style={{ fontSize: '14px', color: '#047857' }}>
                        Your landing page is now accessible at{' '}
                        <a
                          href={`https://${domain.full_domain}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ fontWeight: '600', textDecoration: 'underline' }}
                        >
                          {domain.full_domain}
                        </a>
                      </p>
                      {domain.ssl_status === 'pending' && (
                        <p style={{ fontSize: '12px', color: '#047857', marginTop: '8px' }}>
                          🔒 SSL certificate is being issued. This may take a few minutes.
                        </p>
                      )}
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Add Domain Modal */}
        {showAddModal && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0,0,0,0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
            }}
            onClick={() => setShowAddModal(false)}
          >
            <div
              style={{
                backgroundColor: 'white',
                borderRadius: '12px',
                padding: '32px',
                maxWidth: '500px',
                width: '90%',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '16px' }}>
                Add Custom Domain
              </h3>
              <p style={{ color: '#6B7280', marginBottom: '24px' }}>
                Enter your domain name (e.g., mycoach.com or coaching.mycompany.com)
              </p>
              <input
                type="text"
                value={newDomain}
                onChange={(e) => setNewDomain(e.target.value)}
                placeholder="mycoach.com"
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #D1D5DB',
                  borderRadius: '8px',
                  fontSize: '16px',
                  marginBottom: '24px',
                }}
              />
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => setShowAddModal(false)}
                  style={{
                    padding: '12px 24px',
                    backgroundColor: '#F3F4F6',
                    color: '#374151',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '16px',
                    fontWeight: '600',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddDomain}
                  disabled={adding}
                  style={{
                    padding: '12px 24px',
                    backgroundColor: adding ? '#9CA3AF' : '#3B82F6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '16px',
                    fontWeight: '600',
                    cursor: adding ? 'not-allowed' : 'pointer',
                  }}
                >
                  {adding ? 'Adding...' : 'Add Domain'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
```

---

## Testing Guide

### Local Testing

1. **Edit `/etc/hosts`** (macOS/Linux) or `C:\Windows\System32\drivers\etc\hosts` (Windows):

```
127.0.0.1 mycoach.local
```

2. **Update your local environment**:

```env
PLATFORM_DOMAIN=localhost:3000
```

3. **Test the flow**:
   - Visit `http://mycoach.local:3000` → Should show coach's landing page
   - Visit `http://localhost:3000` → Should show platform landing page

### Production Testing

1. Add a test domain to a coach account
2. Add DNS A record pointing to Vercel IP
3. Wait for DNS propagation (check with `dig mycoach.com` or https://dnschecker.org)
4. Verify domain through wizard
5. Visit domain to confirm it works

---

## Security Considerations

1. **Domain Ownership**: Verify the user owns the domain before activation
2. **One Domain Per Coach**: Enforce 1 active custom domain per coach (or allow multiple with primary)
3. **DNS Validation**: Always verify DNS records match before marking as verified
4. **Rate Limiting**: Limit verification attempts to prevent abuse
5. **HTTPS Only**: Force HTTPS redirects for custom domains
6. **Coach Context**: Always validate coach ownership when serving custom domain content

---

## Limitations & Considerations

1. **DNS Propagation**: Can take up to 48 hours
2. **Vercel Plan**: Custom domains via API requires Pro/Enterprise plan
3. **SSL Issuance**: Automatic but may take 5-30 minutes after DNS verification
4. **Domain Limits**: Vercel has limits on number of domains per project (check your plan)
5. **Subdomain Support**: Fully supported (e.g., `coaching.mycompany.com`)
6. **WWW Redirect**: Consider adding logic to redirect `www.mycoach.com` → `mycoach.com`

---

## Future Enhancements

1. **Email Verification**: Send verification email with TXT record code
2. **Auto-Detection**: Periodically check DNS and auto-verify
3. **Multiple Domains**: Allow coaches to have multiple custom domains
4. **Subdomain Generation**: Offer `coachname.dailycompanion.app` as free option
5. **Analytics**: Track traffic from custom domains separately
6. **Whitelabel Email**: Allow custom email domains for coach communications
7. **Domain Marketplace**: Allow coaches to purchase domains through platform

---

## Troubleshooting

### "Domain not configured" error

- Check DNS propagation: `dig mycoach.com` or https://dnschecker.org
- Verify A record points to correct Vercel IP
- Check database: `status = 'verified'` and `is_active = true`

### SSL certificate not issuing

- Ensure DNS is fully propagated (A record visible globally)
- Check Vercel dashboard for SSL status
- May need to trigger manual SSL issuance in Vercel

### Middleware not detecting custom domain

- Check middleware logs in Vercel
- Verify `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are set
- Test DNS lookup manually
- Check Supabase RLS policies allow read access

### Coach landing page not loading

- Verify coach `is_active = true` and `slug` exists
- Check custom domain record in database
- Test direct URL: `dailycompanion.app/coach/[slug]`

---

## Maintenance

### Monitoring

```sql
-- Check pending domains
SELECT cd.*, c.business_name
FROM custom_domains cd
JOIN coaches c ON c.id = cd.coach_id
WHERE cd.status = 'pending' AND cd.created_at < NOW() - INTERVAL '7 days';

-- Check failed verifications
SELECT cd.*, c.business_name, cd.failed_reason
FROM custom_domains cd
JOIN coaches c ON c.id = cd.coach_id
WHERE cd.status = 'failed';

-- Check SSL pending
SELECT cd.*, c.business_name
FROM custom_domains cd
JOIN coaches c ON c.id = cd.coach_id
WHERE cd.status = 'verified' AND cd.ssl_status = 'pending'
AND cd.verified_at < NOW() - INTERVAL '1 hour';
```

### Cleanup

```sql
-- Remove abandoned domains (pending > 30 days)
DELETE FROM custom_domains
WHERE status = 'pending' AND created_at < NOW() - INTERVAL '30 days';
```

---

## Summary

This feature allows coaches to:
1. ✅ Add their own custom domain
2. ✅ Get DNS configuration instructions
3. ✅ Verify domain ownership via DNS lookup
4. ✅ Automatic SSL certificate issuance
5. ✅ Serve coach landing page on custom domain
6. ✅ Keep user experience on custom domain (optional)
7. ✅ Remove domain when no longer needed

The implementation uses Next.js middleware to detect custom domains, Vercel API for domain management, and Supabase for storage.
