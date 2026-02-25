import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

// GET /api/user/favorites?item_type=daily_practice_audio
export async function GET(request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const itemType = searchParams.get("item_type");

    let query = supabase
      .from("user_favorites")
      .select("*")
      .eq("user_id", user.id);

    if (itemType) {
      query = query.eq("item_type", itemType);
    }

    const { data, error } = await query.order("created_at", {
      ascending: false,
    });

    if (error) {
      console.error("Error fetching favorites:", error);
      return NextResponse.json(
        { error: "Failed to fetch favorites" },
        { status: 500 },
      );
    }

    return NextResponse.json({ favorites: data });
  } catch (error) {
    console.error("Get favorites error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// Resolve coach_id from profile or subscription
async function resolveCoachId(user) {
  if (user.coach_id) return user.coach_id;

  const { data: sub } = await supabase
    .from("user_subscriptions")
    .select("coach_id")
    .eq("user_id", user.id)
    .eq("status", "active")
    .limit(1)
    .maybeSingle();

  return sub?.coach_id || null;
}

// POST /api/user/favorites - Toggle a favorite
export async function POST(request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const coachId = await resolveCoachId(user);
    if (!coachId) {
      return NextResponse.json(
        { error: "No coach associated" },
        { status: 400 },
      );
    }

    const { item_type, item_identifier } = await request.json();

    if (!item_type || !item_identifier) {
      return NextResponse.json(
        { error: "item_type and item_identifier are required" },
        { status: 400 },
      );
    }

    const { data: existing } = await supabase
      .from("user_favorites")
      .select("id")
      .eq("user_id", user.id)
      .eq("item_type", item_type)
      .eq("item_identifier", item_identifier)
      .maybeSingle();

    if (existing) {
      await supabase.from("user_favorites").delete().eq("id", existing.id);
      return NextResponse.json({ favorited: false });
    }

    const { error } = await supabase.from("user_favorites").insert({
      user_id: user.id,
      coach_id: coachId,
      item_type,
      item_identifier,
    });

    if (error) {
      console.error("Error toggling favorite:", error);
      return NextResponse.json(
        { error: "Failed to toggle favorite" },
        { status: 500 },
      );
    }

    return NextResponse.json({ favorited: true });
  } catch (error) {
    console.error("Toggle favorite error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
