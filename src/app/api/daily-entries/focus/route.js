import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

// PATCH /api/daily-entries/focus - Update focus tab data
export async function PATCH(request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      task_1_completed,
      task_2_completed,
      task_3_completed,
      focus_notes,
      intention_obstacles,
      intention_focus_word,
      date,
    } = body;

    // Use provided date or default to today
    const targetDate = date || new Date().toISOString().split("T")[0];

    // Build update object with only provided fields
    const updates = {};
    if (task_1_completed !== undefined)
      updates.task_1_completed = task_1_completed;
    if (task_2_completed !== undefined)
      updates.task_2_completed = task_2_completed;
    if (task_3_completed !== undefined)
      updates.task_3_completed = task_3_completed;
    if (focus_notes !== undefined) updates.focus_notes = focus_notes;
    if (intention_obstacles !== undefined) updates.intention_obstacles = intention_obstacles;
    if (intention_focus_word !== undefined) updates.intention_focus_word = intention_focus_word;

    // Update the entry (create if doesn't exist)
    // First check if entry exists
    const { data: existing } = await supabase
      .from("daily_user_entries")
      .select("id")
      .eq("user_id", user.id)
      .eq("date", targetDate)
      .maybeSingle();

    let entry;
    let error;

    if (!existing) {
      // Create new entry
      const createResult = await supabase
        .from("daily_user_entries")
        .insert({
          user_id: user.id,
          date: targetDate,
          ...updates,
        })
        .select()
        .single();
      entry = createResult.data;
      error = createResult.error;
    } else {
      // Update existing entry
      const updateResult = await supabase
        .from("daily_user_entries")
        .update(updates)
        .eq("user_id", user.id)
        .eq("date", targetDate)
        .select()
        .single();
      entry = updateResult.data;
      error = updateResult.error;
    }

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ entry });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
