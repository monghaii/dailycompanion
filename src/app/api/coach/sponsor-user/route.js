import { NextResponse } from "next/server";
import { getCurrentUserWithCoach } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { incrementSponsorshipQuantity } from "@/lib/stripe";

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

    const { userId, tier } = await request.json();

    if (!userId || ![2, 3].includes(tier)) {
      return NextResponse.json({ error: "Invalid userId or tier" }, { status: 400 });
    }

    // Verify the user belongs to this coach and is Free
    const { data: profile } = await supabase
      .from("profiles")
      .select("id, email, first_name, last_name")
      .eq("id", userId)
      .eq("coach_id", coach.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { data: existingSub } = await supabase
      .from("user_subscriptions")
      .select("status")
      .eq("user_id", userId)
      .in("status", ["active", "trialing"])
      .single();

    if (existingSub) {
      return NextResponse.json(
        { error: "User already has an active subscription" },
        { status: 400 },
      );
    }

    // Get the active sponsorship subscription for this tier
    const { data: sponsorship } = await supabase
      .from("coach_sponsorships")
      .select("*")
      .eq("coach_id", coach.id)
      .eq("subscription_tier", tier)
      .eq("status", "active")
      .single();

    if (!sponsorship?.stripe_subscription_id) {
      return NextResponse.json(
        { error: "No active sponsorship subscription for this tier. Use checkout first." },
        { status: 400 },
      );
    }

    // Increment quantity on the Stripe subscription
    const updated = await incrementSponsorshipQuantity(sponsorship.stripe_subscription_id);

    // Update quantity in our DB
    await supabase
      .from("coach_sponsorships")
      .update({
        quantity: updated.items.data[0].quantity,
        updated_at: new Date().toISOString(),
      })
      .eq("id", sponsorship.id);

    // Create the user's subscription record
    await supabase.from("user_subscriptions").upsert({
      user_id: userId,
      coach_id: coach.id,
      status: "active",
      subscription_tier: tier,
      billing_interval: "monthly",
      price_cents: 0,
      sponsored_by_coach_id: coach.id,
      current_period_start: new Date().toISOString(),
    });

    console.log(
      `[Sponsor User] Coach ${coach.id} sponsored user ${userId} at tier ${tier}, quantity now ${updated.items.data[0].quantity}`,
    );

    return NextResponse.json({ success: true, quantity: updated.items.data[0].quantity });
  } catch (error) {
    console.error("[Sponsor User] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
