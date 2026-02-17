import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

// PATCH - Update a content item
export async function PATCH(request, { params }) {
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
    const body = await request.json();

    const { data: existing } = await supabase
      .from("content_items")
      .select("id")
      .eq("id", id)
      .eq("coach_id", coach.id)
      .single();

    if (!existing) {
      return NextResponse.json(
        { error: "Content item not found" },
        { status: 404 },
      );
    }

    const updates = {};
    if (body.title !== undefined) updates.title = body.title;
    if (body.description !== undefined) updates.description = body.description;
    if (body.duration !== undefined) updates.duration = body.duration;
    if (body.type !== undefined) updates.type = body.type;
    if (body.file_url !== undefined) updates.file_url = body.file_url;
    if (body.link_url !== undefined) updates.link_url = body.link_url;
    if (body.thumbnail_url !== undefined) updates.thumbnail_url = body.thumbnail_url;

    const { data, error } = await supabase
      .from("content_items")
      .update(updates)
      .eq("id", id)
      .eq("coach_id", coach.id)
      .select()
      .single();

    if (error) {
      console.error("Error updating content:", error);
      return NextResponse.json(
        { error: "Failed to update content" },
        { status: 500 },
      );
    }

    return NextResponse.json({ item: data });
  } catch (error) {
    console.error("Update content error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// DELETE - Delete a content item
export async function DELETE(request, { params }) {
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

    const { error } = await supabase
      .from("content_items")
      .delete()
      .eq("id", id)
      .eq("coach_id", coach.id);

    if (error) {
      console.error("Error deleting content:", error);
      return NextResponse.json(
        { error: "Failed to delete content" },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete content error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
