import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

// GET aggregate token usage for all users subscribed to this coach
export async function GET(request) {
  try {
    const user = await getCurrentUser();

    if (!user || user.role !== "coach") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get the coach record
    const { data: coach, error: coachError } = await supabase
      .from("coaches")
      .select("id")
      .eq("profile_id", user.id)
      .single();

    if (coachError || !coach) {
      return NextResponse.json(
        { error: "Coach profile not found" },
        { status: 404 }
      );
    }

    // Get all users linked to this coach via subscriptions OR direct coach_id
    // First, get users from subscriptions
    const { data: subscriptions, error: subError } = await supabase
      .from("user_subscriptions")
      .select("user_id")
      .eq("coach_id", coach.id)
      .eq("status", "active");

    if (subError) {
      console.error("Error fetching subscriptions:", subError);
    }

    // Then get users directly linked via coach_id in profiles
    const { data: directUsers, error: directError } = await supabase
      .from("profiles")
      .select("id")
      .eq("coach_id", coach.id)
      .eq("role", "user");

    if (directError) {
      console.error("Error fetching direct users:", directError);
    }

    // Combine and deduplicate user IDs
    const userIdsSet = new Set();
    if (subscriptions) {
      subscriptions.forEach((sub) => userIdsSet.add(sub.user_id));
    }
    if (directUsers) {
      directUsers.forEach((user) => userIdsSet.add(user.id));
    }

    const userIds = Array.from(userIdsSet);

    // If no users, return zero
    if (userIds.length === 0) {
      return NextResponse.json({
        totalTokens: 0,
        subscriberCount: 0,
        averagePerUser: 0,
        tokenLimit: 1000000,
      });
    }

    // Get token usage for all users
    const { data: profiles, error: profileError } = await supabase
      .from("profiles")
      .select("id, token_usage, token_limit")
      .in("id", userIds);

    if (profileError) {
      console.error("Error fetching profiles:", profileError);
      return NextResponse.json(
        { error: "Failed to fetch token usage" },
        { status: 500 }
      );
    }

    // Calculate aggregate stats
    const totalTokens = profiles.reduce(
      (sum, profile) => sum + (profile.token_usage || 0),
      0
    );
    const subscriberCount = profiles.length;
    const averagePerUser =
      subscriberCount > 0 ? Math.round(totalTokens / subscriberCount) : 0;

    return NextResponse.json({
      totalTokens,
      subscriberCount,
      averagePerUser,
      tokenLimit: 1000000, // Default per-user limit
    });
  } catch (error) {
    console.error("Token usage fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

