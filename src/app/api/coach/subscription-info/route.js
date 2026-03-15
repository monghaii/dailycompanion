import { NextResponse } from "next/server";
import { getCurrentUserWithCoach } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { stripe } from "@/lib/stripe";

export async function GET() {
  try {
    const user = await getCurrentUserWithCoach();
    if (!user || user.role !== "coach") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const coach = user.coach;
    if (!coach) {
      return NextResponse.json({ error: "Coach not found" }, { status: 404 });
    }

    const result = {
      platform: null,
      sponsorships: [],
    };

    // Fetch platform subscription details from Stripe
    if (coach.platform_subscription_id) {
      try {
        const sub = await stripe.subscriptions.retrieve(coach.platform_subscription_id);
        const item = sub.items.data[0];

        result.platform = {
          status: sub.status,
          current_period_start: sub.current_period_start,
          current_period_end: sub.current_period_end,
          cancel_at_period_end: sub.cancel_at_period_end,
          cancel_at: sub.cancel_at,
          canceled_at: sub.canceled_at,
          amount: item?.price?.unit_amount || null,
          currency: item?.price?.currency || "usd",
          interval: item?.price?.recurring?.interval || "month",
          created: sub.created,
          discount: sub.discount
            ? {
                coupon_name: sub.discount.coupon?.name,
                percent_off: sub.discount.coupon?.percent_off,
                amount_off: sub.discount.coupon?.amount_off,
                duration: sub.discount.coupon?.duration,
              }
            : null,
        };
      } catch (err) {
        console.error("Failed to fetch platform subscription:", err.message);
      }
    }

    // Fetch sponsorship (bundling) info
    const { data: sponsorships } = await supabase
      .from("coach_sponsorships")
      .select("*")
      .eq("coach_id", coach.id)
      .order("subscription_tier", { ascending: true });

    if (sponsorships?.length) {
      for (const sp of sponsorships) {
        const entry = {
          tier: sp.subscription_tier,
          status: sp.status,
          quantity: sp.quantity,
          fee_per_user_cents: sp.fee_per_user_cents,
          stripe_details: null,
          sponsored_users: [],
        };

        // Fetch live quantity from Stripe
        if (sp.stripe_subscription_id) {
          try {
            const stripeSub = await stripe.subscriptions.retrieve(sp.stripe_subscription_id);
            const item = stripeSub.items.data[0];
            entry.stripe_details = {
              status: stripeSub.status,
              quantity: item?.quantity || sp.quantity,
              current_period_end: stripeSub.current_period_end,
              amount_per_unit: item?.price?.unit_amount,
              currency: item?.price?.currency || "usd",
              cancel_at_period_end: stripeSub.cancel_at_period_end,
            };
            entry.quantity = item?.quantity || sp.quantity;
          } catch (err) {
            console.error("Failed to fetch sponsorship sub:", err.message);
          }
        }

        // Fetch sponsored users for this tier
        const { data: sponsoredSubs } = await supabase
          .from("user_subscriptions")
          .select("user_id, status, created_at")
          .eq("coach_id", coach.id)
          .eq("sponsored_by_coach_id", coach.id)
          .eq("subscription_tier", sp.subscription_tier)
          .in("status", ["active", "trialing"]);

        if (sponsoredSubs?.length) {
          const userIds = sponsoredSubs.map((s) => s.user_id);
          const { data: profiles } = await supabase
            .from("profiles")
            .select("id, full_name, first_name, last_name, email")
            .in("id", userIds);

          const profileMap = {};
          profiles?.forEach((p) => (profileMap[p.id] = p));

          entry.sponsored_users = sponsoredSubs.map((s) => {
            const p = profileMap[s.user_id];
            return {
              name: p?.full_name || `${p?.first_name || ""} ${p?.last_name || ""}`.trim() || "Unknown",
              email: p?.email,
              status: s.status,
              since: s.created_at,
            };
          });
        }

        result.sponsorships.push(entry);
      }
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Subscription info error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
