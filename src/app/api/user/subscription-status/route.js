import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Get user profile to check test premium flag
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("is_test_premium")
      .eq("id", user.id)
      .single();

    // If user is flagged as test premium, grant access immediately
    if (profile?.is_test_premium === true) {
      // Fetch coach details to mock the subscription object for UI
      const { data: userWithCoach } = await supabase
        .from("profiles")
        .select(
          `
          coach_id,
          coaches:coach_id (
            business_name,
            slug,
            user_monthly_price_cents
          )
        `,
        )
        .eq("id", user.id)
        .single();

      // Mock subscription object
      const mockSubscription = userWithCoach?.coaches
        ? {
            id: "test_subscription",
            coach: userWithCoach.coaches,
            pricePerMonth: userWithCoach.coaches.user_monthly_price_cents / 100,
            currentPeriodEnd: new Date(
              Date.now() + 30 * 24 * 60 * 60 * 1000,
            ).toISOString(), // 30 days from now
            canceledAt: null,
            willCancelAtPeriodEnd: false,
          }
        : null;

      return NextResponse.json({
        isPremium: true,
        status: "test_premium",
        tier: 3, // Test accounts get tier 3 access
        subscription: mockSubscription,
      });
    }

    // Get user's subscription
    const { data: subscription, error: subError } = await supabase
      .from("user_subscriptions")
      .select(
        `
        *,
        coaches:coach_id (
          business_name,
          slug,
          user_monthly_price_cents
        )
      `,
      )
      .eq("user_id", user.id)
      .eq("status", "active")
      .single();

    if (subError || !subscription) {
      // No active subscription - user is FREE (Tier 1)
      return NextResponse.json({
        isPremium: false,
        status: "free",
        tier: 1,
        subscription: null,
      });
    }

    // User has active subscription - PREMIUM (Tier 2 or 3)
    const tier = subscription.subscription_tier || 2; // Default to tier 2 for existing subs

    return NextResponse.json({
      isPremium: true,
      status: subscription.status,
      tier: tier,
      subscription: {
        id: subscription.id,
        coach: subscription.coaches,
        pricePerMonth: subscription.price_cents
          ? subscription.price_cents / 100
          : tier === 2
            ? 19.99
            : subscription.coaches.user_monthly_price_cents / 100,
        currentPeriodEnd: subscription.current_period_end,
        canceledAt: subscription.canceled_at,
        willCancelAtPeriodEnd: !!subscription.canceled_at,
        billingInterval: subscription.billing_interval || "monthly",
      },
    });
  } catch (error) {
    console.error("Get subscription status error:", error);
    return NextResponse.json(
      { error: "Failed to fetch subscription status" },
      { status: 500 },
    );
  }
}
