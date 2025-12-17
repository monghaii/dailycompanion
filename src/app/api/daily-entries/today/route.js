import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

// GET /api/daily-entries/today - Get today's complete daily entry
export async function GET(request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get today's date in YYYY-MM-DD format
    const today = new Date().toISOString().split("T")[0];

    // Try to get existing entry
    const { data: entry, error } = await supabase
      .from("daily_user_entries")
      .select("*")
      .eq("user_id", user.id)
      .eq("date", today)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // If no entry exists, create one
    if (!entry) {
      const { data: newEntry, error: createError } = await supabase
        .from("daily_user_entries")
        .insert({
          user_id: user.id,
          date: today,
          task_1_completed: false,
          task_2_completed: false,
          task_3_completed: false,
          focus_notes: "",
          log_1_entries: [],
          log_2_entries: [],
        })
        .select()
        .single();

      if (createError) {
        return NextResponse.json(
          { error: createError.message },
          { status: 500 }
        );
      }

      return NextResponse.json({ entry: newEntry });
    }

    return NextResponse.json({ entry });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
