import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

// GET - Fetch coach config
export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user || user.role !== "coach") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get coach record
    const { data: coach } = await supabase
      .from("coaches")
      .select("id")
      .eq("profile_id", user.id)
      .single();

    if (!coach) {
      return NextResponse.json({ error: "Coach not found" }, { status: 404 });
    }

    // Get or create config
    const { data, error } = await supabase.rpc("get_or_create_coach_config", {
      p_coach_id: coach.id,
    });

    if (error) {
      console.error("Error fetching config:", error);
      return NextResponse.json(
        { error: "Failed to fetch config" },
        { status: 500 }
      );
    }

    return NextResponse.json({ config: data });
  } catch (error) {
    console.error("Get config error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Update coach config
export async function POST(request) {
  try {
    const user = await getCurrentUser();

    if (!user || user.role !== "coach") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { path, value } = await request.json();

    if (!path || !Array.isArray(path)) {
      return NextResponse.json({ error: "Invalid path" }, { status: 400 });
    }

    // Get coach record
    const { data: coach } = await supabase
      .from("coaches")
      .select("id")
      .eq("profile_id", user.id)
      .single();

    if (!coach) {
      return NextResponse.json({ error: "Coach not found" }, { status: 404 });
    }

    // Update config
    const { data, error } = await supabase.rpc("update_coach_config", {
      p_coach_id: coach.id,
      p_config_path: path,
      p_config_value: value,
    });

    if (error) {
      console.error("Error updating config:", error);
      return NextResponse.json(
        { error: "Failed to update config" },
        { status: 500 }
      );
    }

    return NextResponse.json({ config: data });
  } catch (error) {
    console.error("Update config error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}



