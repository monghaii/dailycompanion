import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

export async function GET(request) {
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

    const coachId = coach.id;
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get("days") || "30", 10);

    const monthsCovered = getMonthsInRange(days);

    // --- Emotions from aggregate table ---
    const { data: emotionRows, error: emotionErr } = await supabase
      .from("emotion_log_counts")
      .select("emotion_label, count")
      .eq("coach_id", coachId)
      .in("period_month", monthsCovered);

    if (emotionErr) {
      console.error("Error fetching emotion aggregates:", emotionErr);
    }

    const emotionTotals = {};
    if (emotionRows) {
      for (const row of emotionRows) {
        emotionTotals[row.emotion_label] =
          (emotionTotals[row.emotion_label] || 0) + row.count;
      }
    }

    const emotions = Object.entries(emotionTotals)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 20);

    // --- Audio from aggregate table ---
    const { data: audioRows, error: audioErr } = await supabase
      .from("audio_play_counts")
      .select("audio_path, audio_name, play_count, favorite_count")
      .eq("coach_id", coachId)
      .in("period_month", monthsCovered);

    if (audioErr) {
      console.error("Error fetching audio aggregates:", audioErr);
    }

    const audioTotals = {};
    if (audioRows) {
      for (const row of audioRows) {
        if (!audioTotals[row.audio_path]) {
          audioTotals[row.audio_path] = {
            name: row.audio_name || "",
            path: row.audio_path,
            plays: 0,
            favorites: 0,
          };
        }
        audioTotals[row.audio_path].plays += row.play_count;
        audioTotals[row.audio_path].favorites += row.favorite_count;
        if (row.audio_name && !audioTotals[row.audio_path].name) {
          audioTotals[row.audio_path].name = row.audio_name;
        }
      }
    }

    // Enrich names from coach config if missing
    const { data: coachConfig } = await supabase
      .from("coach_configs")
      .select("config")
      .eq("coach_id", coachId)
      .single();

    const audioLibrary = coachConfig?.config?.focus_tab?.audio_library || [];
    for (const item of audioLibrary) {
      if (item.audio_path && audioTotals[item.audio_path] && !audioTotals[item.audio_path].name) {
        audioTotals[item.audio_path].name = item.practice_name || item.name || "Untitled";
      }
    }

    const audio = Object.values(audioTotals)
      .map((a) => ({
        ...a,
        name: a.name || "Untitled",
      }))
      .sort((a, b) => (b.plays + b.favorites) - (a.plays + a.favorites))
      .slice(0, 5);

    // --- Resources from aggregate table ---
    const { data: resourceRows, error: resourceErr } = await supabase
      .from("resource_engagement_counts")
      .select("content_item_id, content_title, view_count, favorite_count")
      .eq("coach_id", coachId)
      .in("period_month", monthsCovered);

    if (resourceErr) {
      console.error("Error fetching resource aggregates:", resourceErr);
    }

    const resourceTotals = {};
    if (resourceRows) {
      for (const row of resourceRows) {
        if (!resourceTotals[row.content_item_id]) {
          resourceTotals[row.content_item_id] = {
            id: row.content_item_id,
            name: row.content_title || "",
            views: 0,
            favorites: 0,
          };
        }
        resourceTotals[row.content_item_id].views += row.view_count;
        resourceTotals[row.content_item_id].favorites += row.favorite_count;
        if (row.content_title) {
          resourceTotals[row.content_item_id].name = row.content_title;
        }
      }
    }

    const resources = Object.values(resourceTotals)
      .sort((a, b) => (b.views + b.favorites) - (a.views + a.favorites))
      .slice(0, 5);

    return NextResponse.json({ emotions, audio, resources });
  } catch (error) {
    console.error("Popular content fetch error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

function getMonthsInRange(days) {
  const months = new Set();
  const now = new Date();
  for (let d = 0; d <= days; d++) {
    const date = new Date(now.getTime() - d * 24 * 60 * 60 * 1000);
    months.add(date.toISOString().slice(0, 7));
  }
  return Array.from(months);
}
