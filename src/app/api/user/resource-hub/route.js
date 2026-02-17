import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

// GET - Fetch published collections for the user's coach, with progress
export async function GET(request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const coachId = user.coach_id;
    if (!coachId) {
      return NextResponse.json({ error: "No coach assigned" }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const collectionId = searchParams.get("collectionId");

    if (collectionId) {
      // Fetch single collection with items and user progress
      const { data: collection } = await supabase
        .from("collections")
        .select("*")
        .eq("id", collectionId)
        .eq("coach_id", coachId)
        .eq("is_published", true)
        .single();

      if (!collection) {
        return NextResponse.json({ error: "Collection not found" }, { status: 404 });
      }

      const { data: items } = await supabase
        .from("collection_items")
        .select(`*, content_item:content_items(*)`)
        .eq("collection_id", collectionId)
        .order("sort_order", { ascending: true });

      // Get user's progress for this collection
      const { data: progress } = await supabase
        .from("user_content_progress")
        .select("content_item_id, viewed_at")
        .eq("user_id", user.id)
        .eq("collection_id", collectionId);

      const viewedMap = {};
      (progress || []).forEach((p) => { viewedMap[p.content_item_id] = p.viewed_at; });

      // For drip mode, calculate which items are unlocked
      let dripUnlocked = true;
      let lastCompletionDate = null;
      const enrichedItems = (items || []).map((item) => {
        if (collection.delivery_mode === "drip") {
          if (item.item_type === "pause") {
            // Check if all content items before this pause have been viewed
            if (!dripUnlocked) {
              return { ...item, locked: true };
            }
            // Check if enough days have passed since the last completion
            if (lastCompletionDate) {
              const daysSince = Math.floor((Date.now() - new Date(lastCompletionDate).getTime()) / (1000 * 60 * 60 * 24));
              if (daysSince < (item.pause_days || 1)) {
                dripUnlocked = false;
                return { ...item, locked: true, days_remaining: (item.pause_days || 1) - daysSince };
              }
            } else {
              // No content viewed yet before this pause
              dripUnlocked = false;
              return { ...item, locked: true };
            }
            return { ...item, locked: false };
          }

          // Content item
          const viewed = viewedMap[item.content_item_id];
          if (viewed) {
            lastCompletionDate = viewed;
          }
          return { ...item, viewed: !!viewed, locked: !dripUnlocked };
        }

        // Self-paced: all unlocked
        return { ...item, viewed: !!viewedMap[item.content_item_id], locked: false };
      });

      return NextResponse.json({ collection, items: enrichedItems });
    }

    // List all published collections with item counts and progress
    const { data: collections } = await supabase
      .from("collections")
      .select(`*, collection_items(count)`)
      .eq("coach_id", coachId)
      .eq("is_published", true)
      .order("sort_order", { ascending: true });

    if (!collections || collections.length === 0) {
      return NextResponse.json({ collections: [] });
    }

    // Get progress counts per collection
    const { data: progress } = await supabase
      .from("user_content_progress")
      .select("collection_id, content_item_id")
      .eq("user_id", user.id);

    const progressByCollection = {};
    (progress || []).forEach((p) => {
      progressByCollection[p.collection_id] = (progressByCollection[p.collection_id] || 0) + 1;
    });

    const enrichedCollections = collections.map((c) => ({
      ...c,
      item_count: c.collection_items?.[0]?.count || 0,
      viewed_count: progressByCollection[c.id] || 0,
    }));

    return NextResponse.json({ collections: enrichedCollections });
  } catch (error) {
    console.error("User resource hub error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
