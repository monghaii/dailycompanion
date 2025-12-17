import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

// PATCH /api/daily-entries/awareness - Update awareness tab data
export async function PATCH(request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { log_1_entry, log_2_entry, log_1_entries, log_2_entries, date } =
      body;

    // Use provided date or default to today
    const targetDate = date || new Date().toISOString().split("T")[0];

    // First, get the current entry to append to existing arrays
    const { data: currentEntry, error: fetchError } = await supabase
      .from("daily_user_entries")
      .select("log_1_entries, log_2_entries")
      .eq("user_id", user.id)
      .eq("date", targetDate)
      .maybeSingle();

    if (fetchError) {
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }

    // If no entry exists, create one first
    if (!currentEntry) {
      const { data: newEntry, error: createError } = await supabase
        .from("daily_user_entries")
        .insert({
          user_id: user.id,
          date: targetDate,
          task_1_completed: false,
          task_2_completed: false,
          task_3_completed: false,
          focus_notes: "",
          log_1_entries: [],
          log_2_entries: [],
        })
        .select("log_1_entries, log_2_entries")
        .single();

      if (createError) {
        return NextResponse.json(
          { error: createError.message },
          { status: 500 }
        );
      }

      // Use the new entry as current
      const updates = {};
      if (log_1_entry) {
        updates.log_1_entries = [log_1_entry];
      }
      if (log_2_entry) {
        updates.log_2_entries = [log_2_entry];
      }

      // Update the newly created entry
      const { data: updatedEntry, error: updateError } = await supabase
        .from("daily_user_entries")
        .update(updates)
        .eq("user_id", user.id)
        .eq("date", targetDate)
        .select()
        .single();

      if (updateError) {
        return NextResponse.json(
          { error: updateError.message },
          { status: 500 }
        );
      }

      return NextResponse.json({ entry: updatedEntry });
    }

    // Build update object
    const updates = {};

    // Handle log_1_entries: either append single entry or replace entire array
    if (log_1_entries !== undefined) {
      // Replace entire array (for delete operations)
      updates.log_1_entries = log_1_entries;
    } else if (log_1_entry) {
      // Append single entry
      const currentLog1 = currentEntry.log_1_entries || [];
      updates.log_1_entries = [...currentLog1, log_1_entry];
    }

    // Handle log_2_entries: either append single entry or replace entire array
    if (log_2_entries !== undefined) {
      // Replace entire array (for delete operations)
      updates.log_2_entries = log_2_entries;
    } else if (log_2_entry) {
      // Append single entry
      const currentLog2 = currentEntry.log_2_entries || [];
      updates.log_2_entries = [...currentLog2, log_2_entry];
    }

    // Update the entry
    const { data: entry, error } = await supabase
      .from("daily_user_entries")
      .update(updates)
      .eq("user_id", user.id)
      .eq("date", targetDate)
      .select()
      .single();

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
