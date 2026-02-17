import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

// POST - Mark a content item as viewed
export async function POST(request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { content_item_id, collection_id } = await request.json();

    if (!content_item_id || !collection_id) {
      return NextResponse.json(
        { error: "content_item_id and collection_id are required" },
        { status: 400 },
      );
    }

    const { error } = await supabase
      .from("user_content_progress")
      .upsert(
        {
          user_id: user.id,
          content_item_id,
          collection_id,
          viewed_at: new Date().toISOString(),
        },
        { onConflict: "user_id,content_item_id,collection_id" },
      );

    if (error) {
      console.error("Error saving progress:", error);
      return NextResponse.json({ error: "Failed to save progress" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Progress error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
