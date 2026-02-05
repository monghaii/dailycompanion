import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(request, { params }) {
  try {
    const { slug } = await params;

    if (!slug) {
      return NextResponse.json({ error: "Slug is required" }, { status: 400 });
    }

    // Get coach by slug
    const { data: coach, error: coachError } = await supabase
      .from("coaches")
      .select(
        "id, slug, business_name, bio, tagline, landing_headline, landing_subheadline, landing_cta, logo_url, theme_color, user_monthly_price_cents, user_yearly_price_cents, is_active",
      )
      .eq("slug", slug)
      .single();

    if (coachError || !coach) {
      return NextResponse.json({ error: "Coach not found" }, { status: 404 });
    }

    // Get landing config
    const { data: landingConfig, error: configError } = await supabase
      .from("coach_landing_configs")
      .select("config")
      .eq("coach_id", coach.id)
      .single();

    // If no landing config exists, create default one
    let config = landingConfig?.config;

    if (!landingConfig || !config) {
      // Call the database function to create default config
      const { data: newConfig, error: createError } = await supabase.rpc(
        "get_or_create_landing_config",
        { p_coach_id: coach.id },
      );

      if (createError) {
        console.error("Error creating landing config:", createError);
        // Use fallback default
        config = {
          hero: {
            headline: "Transform Your Life with Personalized Coaching",
            subheadline:
              "Join others on their journey to growth and fulfillment",
            cta_button_text: "Start Your Journey",
          },
          coach_info: {
            name: coach.business_name,
            title: "Life & Wellness Coach",
            bio:
              coach.bio ||
              "Dedicated to helping you achieve your goals and live your best life.",
            photo_url: coach.logo_url,
          },
          pricing: {
            monthly_highlight: true,
            show_yearly: true,
            features: [
              "Daily guided practices",
              "AI-powered coaching conversations",
              "Progress tracking & insights",
              "Unlimited access to all features",
            ],
          },
          testimonials: [],
          branding: {
            primary_color: coach.theme_color || "#7c3aed",
            background_style: "gradient",
          },
        };
      } else {
        config = newConfig;
      }
    }

    // Merge with coach data for convenience
    const response = {
      coach: {
        id: coach.id,
        slug: coach.slug,
        business_name: coach.business_name,
        bio: coach.bio,
        tagline: coach.tagline,
        landing_headline: coach.landing_headline,
        landing_subheadline: coach.landing_subheadline,
        landing_cta: coach.landing_cta,
        logo_url: coach.logo_url,
        theme_color: coach.theme_color,
        is_active: coach.is_active,
        monthly_price_cents: coach.user_monthly_price_cents,
        yearly_price_cents: coach.user_yearly_price_cents,
      },
      config,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Landing config fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch landing page configuration" },
      { status: 500 },
    );
  }
}
