import { supabase } from "@/lib/supabase";

function getCurrentMonth() {
  return new Date().toISOString().slice(0, 7);
}

async function resolveCoachId(userId) {
  const { data: profile } = await supabase
    .from("profiles")
    .select("coach_id")
    .eq("id", userId)
    .single();

  if (profile?.coach_id) return profile.coach_id;

  const { data: sub } = await supabase
    .from("user_subscriptions")
    .select("coach_id")
    .eq("user_id", userId)
    .eq("status", "active")
    .limit(1)
    .maybeSingle();

  return sub?.coach_id || null;
}

export async function incrementEmotionCounts(userId, emotionLabels) {
  if (!emotionLabels || emotionLabels.length === 0) return;

  const coachId = await resolveCoachId(userId);
  if (!coachId) return;

  const month = getCurrentMonth();

  const rows = emotionLabels.map((label) => ({
    coach_id: coachId,
    emotion_label: label,
    period_month: month,
    count: 1,
  }));

  for (const row of rows) {
    const { data: existing } = await supabase
      .from("emotion_log_counts")
      .select("id, count")
      .eq("coach_id", row.coach_id)
      .eq("emotion_label", row.emotion_label)
      .eq("period_month", row.period_month)
      .maybeSingle();

    if (existing) {
      await supabase
        .from("emotion_log_counts")
        .update({ count: existing.count + 1, updated_at: new Date().toISOString() })
        .eq("id", existing.id);
    } else {
      await supabase.from("emotion_log_counts").insert(row);
    }
  }
}

export async function incrementAudioPlayCount(userId, audioPath, audioName) {
  if (!audioPath) return;

  const coachId = await resolveCoachId(userId);
  if (!coachId) return;

  const month = getCurrentMonth();

  const { data: existing } = await supabase
    .from("audio_play_counts")
    .select("id, play_count")
    .eq("coach_id", coachId)
    .eq("audio_path", audioPath)
    .eq("period_month", month)
    .maybeSingle();

  if (existing) {
    await supabase
      .from("audio_play_counts")
      .update({ play_count: existing.play_count + 1, updated_at: new Date().toISOString() })
      .eq("id", existing.id);
  } else {
    await supabase.from("audio_play_counts").insert({
      coach_id: coachId,
      audio_path: audioPath,
      audio_name: audioName || "",
      period_month: month,
      play_count: 1,
      favorite_count: 0,
    });
  }
}

export async function adjustAudioFavoriteCount(coachId, audioPath, delta) {
  if (!audioPath || !coachId) return;

  const month = getCurrentMonth();

  const { data: existing } = await supabase
    .from("audio_play_counts")
    .select("id, favorite_count")
    .eq("coach_id", coachId)
    .eq("audio_path", audioPath)
    .eq("period_month", month)
    .maybeSingle();

  if (existing) {
    await supabase
      .from("audio_play_counts")
      .update({
        favorite_count: Math.max(0, existing.favorite_count + delta),
        updated_at: new Date().toISOString(),
      })
      .eq("id", existing.id);
  } else if (delta > 0) {
    await supabase.from("audio_play_counts").insert({
      coach_id: coachId,
      audio_path: audioPath,
      audio_name: "",
      period_month: month,
      play_count: 0,
      favorite_count: 1,
    });
  }
}

export async function incrementResourceViewCount(userId, contentItemId) {
  if (!contentItemId) return;

  const coachId = await resolveCoachId(userId);
  if (!coachId) return;

  const month = getCurrentMonth();

  const { data: contentItem } = await supabase
    .from("content_items")
    .select("title")
    .eq("id", contentItemId)
    .maybeSingle();

  const { data: existing } = await supabase
    .from("resource_engagement_counts")
    .select("id, view_count")
    .eq("coach_id", coachId)
    .eq("content_item_id", contentItemId)
    .eq("period_month", month)
    .maybeSingle();

  if (existing) {
    await supabase
      .from("resource_engagement_counts")
      .update({ view_count: existing.view_count + 1, updated_at: new Date().toISOString() })
      .eq("id", existing.id);
  } else {
    await supabase.from("resource_engagement_counts").insert({
      coach_id: coachId,
      content_item_id: contentItemId,
      content_title: contentItem?.title || "",
      period_month: month,
      view_count: 1,
      favorite_count: 0,
    });
  }
}

export async function adjustResourceFavoriteCount(coachId, contentItemId, delta) {
  if (!contentItemId || !coachId) return;

  const month = getCurrentMonth();

  const { data: contentItem } = await supabase
    .from("content_items")
    .select("title")
    .eq("id", contentItemId)
    .maybeSingle();

  const { data: existing } = await supabase
    .from("resource_engagement_counts")
    .select("id, favorite_count")
    .eq("coach_id", coachId)
    .eq("content_item_id", contentItemId)
    .eq("period_month", month)
    .maybeSingle();

  if (existing) {
    await supabase
      .from("resource_engagement_counts")
      .update({
        favorite_count: Math.max(0, existing.favorite_count + delta),
        updated_at: new Date().toISOString(),
      })
      .eq("id", existing.id);
  } else if (delta > 0) {
    await supabase.from("resource_engagement_counts").insert({
      coach_id: coachId,
      content_item_id: contentItemId,
      content_title: contentItem?.title || "",
      period_month: month,
      view_count: 0,
      favorite_count: 1,
    });
  }
}
