import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { getSponsorshipFeePerUser, updateSponsorshipPrice } from "@/lib/stripe";

export async function PATCH(request) {
  try {
    const user = await getCurrentUser();

    if (!user || user.role !== "coach") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { business_name, slug, bio, tagline, landing_headline, landing_subheadline, landing_cta, user_monthly_price_cents, tier3_name, tier3_enabled, logo_url, is_active } =
      await request.json();

    // Validate inputs
    if (!business_name || !slug) {
      return NextResponse.json(
        { error: "Business name and URL slug are required" },
        { status: 400 }
      );
    }

    // Check if slug is available (if changed)
    const { data: currentCoach } = await supabase
      .from("coaches")
      .select("id, slug")
      .eq("profile_id", user.id)
      .single();

    if (!currentCoach) {
      return NextResponse.json(
        { error: "Coach profile not found" },
        { status: 404 }
      );
    }

    if (currentCoach.slug !== slug) {
      const { data: existingSlug } = await supabase
        .from("coaches")
        .select("id")
        .eq("slug", slug)
        .neq("id", currentCoach.id)
        .single();

      if (existingSlug) {
        return NextResponse.json(
          { error: "This URL slug is already taken" },
          { status: 400 }
        );
      }
    }

    // Update coach profile
    const updateData = {
      business_name,
      slug,
      bio,
      tagline,
      landing_headline,
      landing_subheadline,
      landing_cta,
      user_monthly_price_cents,
      tier3_name: tier3_name || "Premium Plus",
      tier3_enabled: tier3_enabled !== false,
      updated_at: new Date().toISOString(),
    };

    if (logo_url !== undefined) {
      updateData.logo_url = logo_url;
    }
    if (is_active !== undefined) {
      updateData.is_active = is_active;
    }

    const { data: updatedCoach, error } = await supabase
      .from("coaches")
      .update(updateData)
      .eq("id", currentCoach.id)
      .select()
      .single();

    if (error) {
      console.error("Error updating coach profile:", error);
      return NextResponse.json(
        { error: "Failed to update profile" },
        { status: 500 }
      );
    }

    // If T3 price changed, sync sponsorship pricing
    if (user_monthly_price_cents) {
      try {
        const { data: t3Sponsorship } = await supabase
          .from("coach_sponsorships")
          .select("*")
          .eq("coach_id", currentCoach.id)
          .eq("subscription_tier", 3)
          .eq("status", "active")
          .single();

        if (t3Sponsorship?.stripe_subscription_id) {
          const newFee = getSponsorshipFeePerUser(3, { user_monthly_price_cents });
          if (newFee !== t3Sponsorship.fee_per_user_cents) {
            const currency = updatedCoach.stripe_country
              ? { US: "usd", DE: "eur", FR: "eur", ES: "eur", IT: "eur", NL: "eur", IE: "eur", BE: "eur", AT: "eur", GB: "gbp", CA: "cad", AU: "aud", NZ: "nzd", CH: "chf", SG: "sgd" }[updatedCoach.stripe_country] || "usd"
              : "usd";

            await updateSponsorshipPrice(
              t3Sponsorship.stripe_subscription_id,
              newFee,
              currency,
            );
            console.log(
              `[Profile] Synced T3 sponsorship fee: ${t3Sponsorship.fee_per_user_cents} -> ${newFee} cents`,
            );
          }
        }
      } catch (syncError) {
        console.error("[Profile] Failed to sync sponsorship price:", syncError);
      }
    }

    return NextResponse.json({ coach: updatedCoach });
  } catch (error) {
    console.error("Update profile error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
