import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

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

    const coachId = coach.id;

    const { data: subs } = await supabase
      .from("user_subscriptions")
      .select("user_id")
      .eq("coach_id", coachId)
      .eq("status", "active");

    const { data: directUsers } = await supabase
      .from("profiles")
      .select("id")
      .eq("coach_id", coachId)
      .eq("role", "user");

    const userIdsSet = new Set();
    if (subs) subs.forEach((s) => userIdsSet.add(s.user_id));
    if (directUsers) directUsers.forEach((u) => userIdsSet.add(u.id));
    const userIds = Array.from(userIdsSet);

    if (userIds.length === 0) {
      return NextResponse.json({ message: "No users to backfill", counts: {} });
    }

    // Clear existing aggregate data for this coach
    await supabase.from("emotion_log_counts").delete().eq("coach_id", coachId);
    await supabase.from("audio_play_counts").delete().eq("coach_id", coachId);
    await supabase.from("resource_engagement_counts").delete().eq("coach_id", coachId);

    // --- Backfill emotions ---
    const { data: entries } = await supabase
      .from("daily_user_entries")
      .select("log_2_entries, date")
      .in("user_id", userIds)
      .not("log_2_entries", "is", null);

    const emotionAgg = {};
    let emotionTotal = 0;
    if (entries) {
      for (const row of entries) {
        const month = row.date?.slice(0, 7);
        if (!month) continue;
        const logs = row.log_2_entries;
        if (!Array.isArray(logs)) continue;
        for (const log of logs) {
          if (!Array.isArray(log.emotions)) continue;
          for (const emotionKey of log.emotions) {
            const label = emotionKey.includes("-")
              ? emotionKey.split("-").slice(1).join("-")
              : emotionKey;
            const key = `${label}||${month}`;
            emotionAgg[key] = (emotionAgg[key] || 0) + 1;
            emotionTotal++;
          }
        }
      }
    }

    const emotionRows = Object.entries(emotionAgg).map(([key, count]) => {
      const [emotion_label, period_month] = key.split("||");
      return { coach_id: coachId, emotion_label, period_month, count };
    });

    if (emotionRows.length > 0) {
      const batchSize = 500;
      for (let i = 0; i < emotionRows.length; i += batchSize) {
        await supabase.from("emotion_log_counts").insert(emotionRows.slice(i, i + batchSize));
      }
    }

    // --- Backfill audio favorites ---
    const { data: audioFavs } = await supabase
      .from("user_favorites")
      .select("item_identifier, created_at")
      .eq("coach_id", coachId)
      .eq("item_type", "daily_practice_audio");

    const { data: coachConfig } = await supabase
      .from("coach_configs")
      .select("config")
      .eq("coach_id", coachId)
      .single();

    const audioLibrary = coachConfig?.config?.focus_tab?.audio_library || [];
    const audioNameMap = {};
    for (const a of audioLibrary) {
      if (a.audio_path) {
        audioNameMap[a.audio_path] = a.practice_name || a.name || "";
      }
    }

    const audioAgg = {};
    if (audioFavs) {
      for (const fav of audioFavs) {
        const month = fav.created_at?.slice(0, 7) || new Date().toISOString().slice(0, 7);
        const key = `${fav.item_identifier}||${month}`;
        if (!audioAgg[key]) {
          audioAgg[key] = { play_count: 0, favorite_count: 0 };
        }
        audioAgg[key].favorite_count++;
      }
    }

    const audioRows = Object.entries(audioAgg).map(([key, counts]) => {
      const [audio_path, period_month] = key.split("||");
      return {
        coach_id: coachId,
        audio_path,
        audio_name: audioNameMap[audio_path] || "",
        period_month,
        play_count: counts.play_count,
        favorite_count: counts.favorite_count,
      };
    });

    if (audioRows.length > 0) {
      await supabase.from("audio_play_counts").insert(audioRows);
    }

    // --- Backfill resource views + favorites ---
    const { data: progress } = await supabase
      .from("user_content_progress")
      .select("content_item_id, viewed_at")
      .in("user_id", userIds);

    const { data: contentItems } = await supabase
      .from("content_items")
      .select("id, title")
      .eq("coach_id", coachId);

    const contentTitleMap = {};
    if (contentItems) {
      for (const ci of contentItems) {
        contentTitleMap[ci.id] = ci.title || "";
      }
    }

    const resourceAgg = {};
    if (progress) {
      for (const p of progress) {
        if (!contentTitleMap.hasOwnProperty(p.content_item_id)) continue;
        const month = p.viewed_at?.slice(0, 7) || new Date().toISOString().slice(0, 7);
        const key = `${p.content_item_id}||${month}`;
        if (!resourceAgg[key]) {
          resourceAgg[key] = { view_count: 0, favorite_count: 0 };
        }
        resourceAgg[key].view_count++;
      }
    }

    const { data: resourceFavs } = await supabase
      .from("user_favorites")
      .select("item_identifier, created_at")
      .eq("coach_id", coachId)
      .eq("item_type", "resource_hub_content");

    if (resourceFavs) {
      for (const fav of resourceFavs) {
        const month = fav.created_at?.slice(0, 7) || new Date().toISOString().slice(0, 7);
        const key = `${fav.item_identifier}||${month}`;
        if (!resourceAgg[key]) {
          resourceAgg[key] = { view_count: 0, favorite_count: 0 };
        }
        resourceAgg[key].favorite_count++;
      }
    }

    const resourceRows = Object.entries(resourceAgg).map(([key, counts]) => {
      const [content_item_id, period_month] = key.split("||");
      return {
        coach_id: coachId,
        content_item_id,
        content_title: contentTitleMap[content_item_id] || "",
        period_month,
        view_count: counts.view_count,
        favorite_count: counts.favorite_count,
      };
    });

    if (resourceRows.length > 0) {
      await supabase.from("resource_engagement_counts").insert(resourceRows);
    }

    return NextResponse.json({
      message: "Backfill complete",
      counts: {
        emotions: emotionTotal,
        emotionRows: emotionRows.length,
        audioRows: audioRows.length,
        resourceRows: resourceRows.length,
      },
    });
  } catch (error) {
    console.error("Backfill error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
