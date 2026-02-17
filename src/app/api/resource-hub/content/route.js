import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

// GET - List all content items for the coach
export async function GET() {
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

    const { data, error } = await supabase
      .from("content_items")
      .select("*")
      .eq("coach_id", coach.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching content:", error);
      return NextResponse.json(
        { error: "Failed to fetch content" },
        { status: 500 },
      );
    }

    return NextResponse.json({ items: data });
  } catch (error) {
    console.error("Get content error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// POST - Create a new content item
export async function POST(request) {
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

    const body = await request.json();
    const { type, title, description, duration, file_url, file_size, thumbnail_url, link_url } = body;

    if (!type || !title) {
      return NextResponse.json(
        { error: "type and title are required" },
        { status: 400 },
      );
    }

    if (!file_url && !link_url) {
      return NextResponse.json(
        { error: "Either file_url or link_url is required" },
        { status: 400 },
      );
    }

    const { data, error } = await supabase
      .from("content_items")
      .insert({
        coach_id: coach.id,
        type,
        title,
        description: description || null,
        duration: duration || null,
        file_url: file_url || null,
        file_size: file_size || null,
        thumbnail_url: thumbnail_url || null,
        link_url: link_url || null,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating content:", error);
      return NextResponse.json(
        { error: "Failed to create content" },
        { status: 500 },
      );
    }

    return NextResponse.json({ item: data }, { status: 201 });
  } catch (error) {
    console.error("Create content error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
