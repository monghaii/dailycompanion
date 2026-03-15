import { NextResponse } from "next/server";
import { getCurrentUserWithCoach } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { decrementSponsorshipQuantity } from "@/lib/stripe";

export async function POST(request) {
  try {
    const user = await getCurrentUserWithCoach();

    if (!user || user.role !== "coach") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const coach = user.coach;
    if (!coach) {
      return NextResponse.json({ error: "Coach profile not found" }, { status: 404 });
    }

    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    // Verify this user is sponsored by this coach
    const { data: userSub } = await supabase
      .from("user_subscriptions")
      .select("*")
      .eq("user_id", userId)
      .eq("sponsored_by_coach_id", coach.id)
      .eq("status", "active")
      .single();

    if (!userSub) {
      return NextResponse.json(
        { error: "No active sponsored subscription found for this user" },
        { status: 404 },
      );
    }

    const tier = userSub.subscription_tier;

    // Get the sponsorship subscription
    const { data: sponsorship } = await supabase
      .from("coach_sponsorships")
      .select("*")
      .eq("coach_id", coach.id)
      .eq("subscription_tier", tier)
      .eq("status", "active")
      .single();

    if (!sponsorship?.stripe_subscription_id) {
      return NextResponse.json(
        { error: "Sponsorship subscription not found" },
        { status: 404 },
      );
    }

    // Decrement (or cancel if last user)
    const result = await decrementSponsorshipQuantity(sponsorship.stripe_subscription_id);

    if (result.canceled) {
      await supabase
        .from("coach_sponsorships")
        .update({ status: "canceled", quantity: 0, updated_at: new Date().toISOString() })
        .eq("id", sponsorship.id);
    } else {
      await supabase
        .from("coach_sponsorships")
        .update({
          quantity: result.subscription.items.data[0].quantity,
          updated_at: new Date().toISOString(),
        })
        .eq("id", sponsorship.id);
    }

    // Mark the user's subscription as canceled (access continues until period end)
    // We keep the record so the user retains access until the current billing period ends
    await supabase
      .from("user_subscriptions")
      .update({
        status: "canceled",
        canceled_at: new Date().toISOString(),
      })
      .eq("user_id", userId)
      .eq("sponsored_by_coach_id", coach.id);

    console.log(
      `[Cancel Sponsorship] Coach ${coach.id} removed sponsorship for user ${userId}, tier ${tier}`,
    );

    return NextResponse.json({ success: true, canceled: result.canceled });
  } catch (error) {
    console.error("[Cancel Sponsorship] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
