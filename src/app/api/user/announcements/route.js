import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!user.coach_id) {
      return NextResponse.json({ announcements: [] });
    }

    const { data, error } = await supabase
      .from("coach_announcements")
      .select("id, title, body, icon, link, is_pinned, created_at")
      .eq("coach_id", user.coach_id)
      .order("is_pinned", { ascending: false })
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Fetch user announcements error:", error);
      return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
    }

    return NextResponse.json({ announcements: data || [] });
  } catch (error) {
    console.error("Get user announcements error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
