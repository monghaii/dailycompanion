import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function middleware(request) {
  const { pathname, hostname } = request.nextUrl;
  
  // Platform domain - no modifications needed
  const platformDomain = process.env.NEXT_PUBLIC_PLATFORM_DOMAIN || 'dailycompanion.app';
  const isLocalhost = hostname === 'localhost' || hostname.includes('127.0.0.1');
  
  // If on platform domain or localhost, proceed normally
  if (hostname === platformDomain || isLocalhost || hostname.includes('vercel.app')) {
    return NextResponse.next();
  }
  
  // Custom domain detected - look up associated coach
  console.log(`[Middleware] Custom domain detected: ${hostname}`);
  
  // Initialize Supabase client inside the middleware function
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('[Middleware] Supabase credentials not configured');
    return NextResponse.next();
  }
  
  const supabase = createClient(supabaseUrl, supabaseKey);
  
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
      
      // Add custom headers to identify custom domain context
      response.headers.set('X-Custom-Domain', hostname);
      response.headers.set('X-Coach-Slug', coach.slug);
      response.headers.set('X-Coach-Id', coach.id);
      
      return response;
    }
    
    // Already has /coach/ prefix → rewrite to coach's landing page if it's their slug
    if (pathname.startsWith('/coach/')) {
      const slugMatch = pathname.match(/^\/coach\/([^\/]+)/);
      if (slugMatch && slugMatch[1] === coach.slug) {
        // This is the correct coach's landing page, serve it
        const response = NextResponse.next();
        response.headers.set('X-Custom-Domain', hostname);
        response.headers.set('X-Coach-Slug', coach.slug);
        response.headers.set('X-Coach-Id', coach.id);
        return response;
      }
    }
    
    // User dashboard, login, signup → keep as is but add context
    if (
      pathname.startsWith('/user/') ||
      pathname.startsWith('/login') ||
      pathname.startsWith('/signup') ||
      pathname.startsWith('/api/')
    ) {
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
     * - public folder files
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
