import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

// GET - Fetch the user's coach config
export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Determine the coach_id to load config for
    let coachId = user.coach_id;

    // If user is a coach with no coach_id, look up their own coach record
    if (!coachId && user.role === "coach") {
      const { data: ownCoach } = await supabase
        .from("coaches")
        .select("id")
        .eq("profile_id", user.id)
        .single();
      coachId = ownCoach?.id;
    }

    if (!coachId) {
      return NextResponse.json({ config: null });
    }

    // Get coach config
    const { data, error } = await supabase.rpc("get_or_create_coach_config", {
      p_coach_id: coachId,
    });

    if (error) {
      console.error("Error fetching coach config:", error);
      return NextResponse.json(
        { error: "Failed to fetch coach config" },
        { status: 500 }
      );
    }

    return NextResponse.json({ config: data });
  } catch (error) {
    console.error("Get coach config error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}



