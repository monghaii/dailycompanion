import { NextResponse } from "next/server";
import { getCurrentUserWithCoach } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

export async function GET() {
  try {
    const user = await getCurrentUserWithCoach();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // If user is a regular user and has a coach_id, fetch the coach details
    if (user.role === "user" && user.coach_id) {
      const { data: coach } = await supabase
        .from("coaches")
        .select("business_name, slug, logo_url, bio, tagline, user_monthly_price_cents, user_yearly_price_cents, tier3_name, tier3_enabled")
        .eq("id", user.coach_id)
        .single();

      if (coach) {
        user.coach = coach;
      }
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error("Get user error:", error);
    return NextResponse.json({ error: "Failed to get user" }, { status: 500 });
  }
}
