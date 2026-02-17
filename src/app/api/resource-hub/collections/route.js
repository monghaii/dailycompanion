import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

// GET - List all collections for the coach
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
      .from("collections")
      .select(`
        *,
        collection_items(count)
      `)
      .eq("coach_id", coach.id)
      .order("sort_order", { ascending: true });

    if (error) {
      console.error("Error fetching collections:", error);
      return NextResponse.json(
        { error: "Failed to fetch collections" },
        { status: 500 },
      );
    }

    const collections = data.map((c) => ({
      ...c,
      item_count: c.collection_items?.[0]?.count || 0,
    }));

    return NextResponse.json({ collections });
  } catch (error) {
    console.error("Get collections error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// POST - Create a new collection
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
    const { title, description, icon, delivery_mode } = body;

    if (!title) {
      return NextResponse.json(
        { error: "title is required" },
        { status: 400 },
      );
    }

    // Get max sort_order for this coach
    const { data: maxRow } = await supabase
      .from("collections")
      .select("sort_order")
      .eq("coach_id", coach.id)
      .order("sort_order", { ascending: false })
      .limit(1)
      .single();

    const nextOrder = (maxRow?.sort_order ?? -1) + 1;

    const { data, error } = await supabase
      .from("collections")
      .insert({
        coach_id: coach.id,
        title,
        description: description || null,
        icon: icon || "folder",
        delivery_mode: delivery_mode || "self_paced",
        sort_order: nextOrder,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating collection:", error);
      return NextResponse.json(
        { error: "Failed to create collection" },
        { status: 500 },
      );
    }

    return NextResponse.json({ collection: data }, { status: 201 });
  } catch (error) {
    console.error("Create collection error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
