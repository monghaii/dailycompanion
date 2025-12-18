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

    // If user doesn't have a coach_id, return default config
    if (!user.coach_id) {
      return NextResponse.json({ config: null });
    }

    // Get coach config
    const { data, error } = await supabase.rpc("get_or_create_coach_config", {
      p_coach_id: user.coach_id,
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
