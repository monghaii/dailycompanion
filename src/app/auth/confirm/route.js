import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type");
  const next = searchParams.get("next") || "/";

  if (!token_hash || !type) {
    return NextResponse.redirect(new URL("/login?error=missing_token", request.url));
  }

  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );

  const { data, error } = await supabase.auth.verifyOtp({
    type,
    token_hash,
  });

  if (error || !data?.session) {
    console.error("Auth confirm error:", error);
    // Redirect to an appropriate page with an error
    const fallback = type === "recovery" ? "/forgot-password" : "/login";
    return NextResponse.redirect(new URL(`${fallback}?error=invalid_or_expired_link`, request.url));
  }

  // For recovery flow, redirect to reset-password page with access_token in hash
  if (type === "recovery") {
    const redirectUrl = new URL(next, request.url);
    redirectUrl.hash = `access_token=${data.session.access_token}&type=recovery`;
    return NextResponse.redirect(redirectUrl);
  }

  // For other types (email confirmation, etc.), redirect to next
  const redirectUrl = new URL(next, request.url);
  redirectUrl.hash = `access_token=${data.session.access_token}`;
  return NextResponse.redirect(redirectUrl);
}
