import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(request) {
  try {
    const body = await request.json();
    const { email, isCoach, coachSlug } = body;

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // Determine redirect URL based on user type
    let redirectPath = isCoach ? "/coach/reset-password" : "/reset-password";
    
    // Append coach slug for branded reset flow if present
    if (!isCoach && coachSlug) {
      redirectPath += `?coach=${coachSlug}`;
    }

    // Always redirect through the platform domain so Supabase's allowlist accepts it.
    // Custom coach domains can't all be registered in Supabase's redirect URLs.
    const platformOrigin = `https://${process.env.NEXT_PUBLIC_PLATFORM_DOMAIN || "dailycompanion.app"}`;
    const redirectUrl = `${platformOrigin}${redirectPath}`;

    // Create a regular Supabase client (not admin) to send password reset email
    // This will trigger Supabase's built-in email sending
    const supabaseClient = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Send password reset email - Supabase will handle the email sending
    const { error } = await supabaseClient.auth.resetPasswordForEmail(email, {
      redirectTo: redirectUrl,
    });

    if (error) {
      console.error("Password reset error:", error);
      // Don't reveal if user exists for security
    }

    return NextResponse.json({
      success: true,
      message:
        "If an account exists with this email, you will receive a password reset link.",
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to process request" },
      { status: 500 }
    );
  }
}
