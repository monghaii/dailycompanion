import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

const POSTHOG_API_KEY = process.env.POSTHOG_PERSONAL_API_KEY;
const POSTHOG_PROJECT_ID = process.env.POSTHOG_PROJECT_ID;
const POSTHOG_HOST = "https://us.posthog.com";

async function queryPostHog(query) {
  const res = await fetch(`${POSTHOG_HOST}/api/projects/${POSTHOG_PROJECT_ID}/query/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${POSTHOG_API_KEY}`,
    },
    body: JSON.stringify({ query }),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error("PostHog query failed:", res.status, text);
    return null;
  }

  return res.json();
}

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
    const dateFrom = `-${days}d`;

    const engagementQuery = {
      kind: "HogQLQuery",
      query: `
        SELECT
          properties.tab_name AS tab,
          count() AS cnt
        FROM events
        WHERE
          event = 'tab_switched'
          AND person.properties.coach_id = '${coachId}'
          AND timestamp >= now() - interval ${days} day
        GROUP BY tab
        ORDER BY cnt DESC
      `,
    };

    const dailyActiveQuery = {
      kind: "HogQLQuery",
      query: `
        SELECT
          count(DISTINCT person_id) AS dau
        FROM events
        WHERE
          event = '$pageview'
          AND person.properties.coach_id = '${coachId}'
          AND timestamp >= now() - interval 1 day
      `,
    };

    const totalActionsQuery = {
      kind: "HogQLQuery",
      query: `
        SELECT
          event,
          count() AS cnt
        FROM events
        WHERE
          event IN ('focus_task_completed', 'intention_set', 'morning_practice_audio_played', 'chat_message_sent', 'resource_hub_collection_opened', 'resource_hub_content_viewed')
          AND person.properties.coach_id = '${coachId}'
          AND timestamp >= now() - interval ${days} day
        GROUP BY event
        ORDER BY cnt DESC
      `,
    };

    // Days per user where focus tasks were completed
    const habitQuery = {
      kind: "HogQLQuery",
      query: `
        SELECT
          person_id,
          count(DISTINCT toDate(timestamp)) AS active_days
        FROM events
        WHERE
          event = 'focus_task_completed'
          AND person.properties.coach_id = '${coachId}'
          AND timestamp >= now() - interval ${days} day
        GROUP BY person_id
      `,
    };

    // Days per user where they took any action
    const ongoingQuery = {
      kind: "HogQLQuery",
      query: `
        SELECT
          person_id,
          count(DISTINCT toDate(timestamp)) AS active_days
        FROM events
        WHERE
          event IN ('focus_task_completed', 'intention_set', 'morning_practice_audio_played', 'chat_message_sent', 'tab_switched', 'emotional_state_logged', 'awareness_moment_logged', 'resource_hub_collection_opened', 'resource_hub_content_viewed')
          AND person.properties.coach_id = '${coachId}'
          AND timestamp >= now() - interval ${days} day
        GROUP BY person_id
      `,
    };

    const [engagementRes, dauRes, actionsRes, habitRes, ongoingRes] = await Promise.all([
      queryPostHog(engagementQuery),
      queryPostHog(dailyActiveQuery),
      queryPostHog(totalActionsQuery),
      queryPostHog(habitQuery),
      queryPostHog(ongoingQuery),
    ]);

    const tabCounts = {};
    let totalTabSwitches = 0;
    if (engagementRes?.results) {
      for (const row of engagementRes.results) {
        const tabName = row[0];
        const count = row[1];
        if (tabName) {
          tabCounts[tabName] = count;
          totalTabSwitches += count;
        }
      }
    }

    const TAB_MAP = {
      focus: { label: "Focus Tab", description: "Daily practices & intentions", color: "#f97316" },
      awareness: { label: "Awareness Tab", description: "Logging & reflection", color: "#3b82f6" },
      coach: { label: "Coach Tab", description: "AI coaching conversations", color: "#a855f7" },
      more: { label: "Resources Hub", description: "Videos & recordings", color: "#22c55e" },
    };

    const sectionUsage = Object.entries(TAB_MAP).map(([key, meta]) => {
      const count = tabCounts[key] || 0;
      const percent = totalTabSwitches > 0 ? Math.round((count / totalTabSwitches) * 100) : 0;
      return { key, ...meta, count, percent };
    });

    const dau = dauRes?.results?.[0]?.[0] || 0;

    const actionCounts = {};
    if (actionsRes?.results) {
      for (const row of actionsRes.results) {
        actionCounts[row[0]] = row[1];
      }
    }

    const weeks = Math.max(days / 7, 1);

    function bucketUsers(results) {
      const buckets = { high: 0, medium: 0, low: 0, rare: 0 };
      let totalRate = 0;
      let userCount = 0;

      if (results) {
        for (const row of results) {
          const activeDays = row[1];
          const perWeek = activeDays / weeks;
          totalRate += perWeek;
          userCount++;

          if (perWeek >= 7) buckets.high++;
          else if (perWeek >= 4) buckets.medium++;
          else if (perWeek >= 1) buckets.low++;
          else buckets.rare++;
        }
      }

      const total = userCount || 1;
      return {
        buckets: {
          high: Math.round((buckets.high / total) * 100),
          medium: Math.round((buckets.medium / total) * 100),
          low: Math.round((buckets.low / total) * 100),
          rare: Math.round((buckets.rare / total) * 100),
        },
        avgRate: userCount > 0 ? (totalRate / userCount).toFixed(1) : "0",
        userCount,
      };
    }

    const habitFormation = bucketUsers(habitRes?.results);
    const ongoingEngagement = bucketUsers(ongoingRes?.results);

    return NextResponse.json({
      sectionUsage,
      totalTabSwitches,
      dau,
      actionCounts,
      habitFormation,
      ongoingEngagement,
      period: days,
    });
  } catch (error) {
    console.error("Analytics fetch error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
