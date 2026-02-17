import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

// PUT - Replace all items in a collection (saves full ordered list including pauses)
export async function PUT(request, { params }) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "coach") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: coach } = await supabase
      .from("coaches")
      .select("id")
      .eq("profile_id", user.id)
      .single();

    if (!coach) {
      return NextResponse.json({ error: "Coach not found" }, { status: 404 });
    }

    const { id } = await params;

    // Verify collection belongs to coach
    const { data: collection } = await supabase
      .from("collections")
      .select("id")
      .eq("id", id)
      .eq("coach_id", coach.id)
      .single();

    if (!collection) {
      return NextResponse.json(
        { error: "Collection not found" },
        { status: 404 },
      );
    }

    const body = await request.json();
    const { items } = body;

    if (!Array.isArray(items)) {
      return NextResponse.json(
        { error: "items must be an array" },
        { status: 400 },
      );
    }

    // Delete all existing items
    await supabase
      .from("collection_items")
      .delete()
      .eq("collection_id", id);

    // Insert new items
    if (items.length > 0) {
      const rows = items.map((item, index) => ({
        collection_id: id,
        content_item_id: item.item_type === "content" ? item.content_item_id : null,
        item_type: item.item_type || "content",
        sort_order: index,
        pause_days: item.item_type === "pause" ? (item.pause_days || 1) : null,
      }));

      const { error } = await supabase
        .from("collection_items")
        .insert(rows);

      if (error) {
        console.error("Error inserting collection items:", error);
        return NextResponse.json(
          { error: "Failed to save collection items" },
          { status: 500 },
        );
      }
    }

    // Fetch updated items with content details
    const { data: updatedItems } = await supabase
      .from("collection_items")
      .select(`
        *,
        content_item:content_items(*)
      `)
      .eq("collection_id", id)
      .order("sort_order", { ascending: true });

    return NextResponse.json({ items: updatedItems || [] });
  } catch (error) {
    console.error("Update collection items error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
