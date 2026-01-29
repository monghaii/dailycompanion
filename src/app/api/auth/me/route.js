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
        .select(`
          business_name, 
          slug, 
          logo_url,
          bio,
          profile_id,
          profiles!coaches_profile_id_fkey(
            full_name,
            avatar_url
          )
        `)
        .eq("id", user.coach_id)
        .single();

      if (coach) {
        // Flatten the profile data for easier access
        user.coach = {
          business_name: coach.business_name,
          slug: coach.slug,
          logo_url: coach.logo_url,
          bio: coach.bio,
          profile: {
            full_name: coach.profiles?.full_name,
            avatar_url: coach.profiles?.avatar_url,
          }
        };
      }
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error("Get user error:", error);
    return NextResponse.json({ error: "Failed to get user" }, { status: 500 });
  }
}
