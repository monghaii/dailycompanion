import { NextResponse } from "next/server";
import { getCurrentUserWithCoach } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import {
  getSponsorshipFeePerUser,
  createSponsorshipCheckoutSession,
} from "@/lib/stripe";

const COUNTRY_CURRENCY_MAP = {
  US: "usd", DE: "eur", FR: "eur", ES: "eur", IT: "eur", NL: "eur",
  IE: "eur", BE: "eur", AT: "eur", GB: "gbp", CA: "cad", AU: "aud",
  NZ: "nzd", CH: "chf", SG: "sgd",
};

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

    if (!coach.stripe_account_id || coach.stripe_account_status !== "active") {
      return NextResponse.json(
        { error: "You must set up Stripe Connect before sponsoring users" },
        { status: 400 },
      );
    }

    const { userId, tier } = await request.json();

    if (!userId || ![2, 3].includes(tier)) {
      return NextResponse.json({ error: "Invalid userId or tier" }, { status: 400 });
    }

    if (tier === 3 && !coach.tier3_enabled) {
      return NextResponse.json({ error: "Tier 3 is not enabled" }, { status: 400 });
    }

    // Verify the user belongs to this coach and is currently Free
    const { data: profile } = await supabase
      .from("profiles")
      .select("id, email")
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

    const feePerUser = getSponsorshipFeePerUser(tier, coach);
    const currency = COUNTRY_CURRENCY_MAP[coach.stripe_country] || "usd";

    // Check if coach already has a sponsorship subscription for this tier
    const { data: existing } = await supabase
      .from("coach_sponsorships")
      .select("*")
      .eq("coach_id", coach.id)
      .eq("subscription_tier", tier)
      .eq("status", "active")
      .single();

    if (existing?.stripe_subscription_id) {
      // Already has an active sponsorship subscription for this tier -
      // redirect to the increment route instead
      return NextResponse.json({
        action: "increment",
        message: "Use /api/coach/sponsor-user to add to existing sponsorship",
      });
    }

    // Create a new checkout session for the first sponsored user at this tier
    const session = await createSponsorshipCheckoutSession({
      coachId: coach.id,
      coachStripeCustomerId: coach.stripe_customer_id || null,
      coachEmail: user.email,
      tier,
      feePerUserCents: feePerUser,
      currency,
      userId,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("[Sponsor Checkout] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
