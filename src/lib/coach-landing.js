import { supabase } from "@/lib/supabase";

export async function getCoachLandingData(slug) {
  if (!slug) return null;

  // Get coach by slug
  const { data: coach, error: coachError } = await supabase
    .from("coaches")
    .select(
      "id, slug, business_name, bio, tagline, landing_headline, landing_subheadline, landing_cta, logo_url, theme_color, user_monthly_price_cents, user_yearly_price_cents, tier3_name, tier3_enabled, is_active, stripe_country",
    )
    .eq("slug", slug)
    .single();

  if (coachError || !coach) {
    return null;
  }

  // Get branding config for app logo and primary color
  const { data: coachConfig } = await supabase
    .from("coach_configs")
    .select("config")
    .eq("coach_id", coach.id)
    .single();

  const brandingData = coachConfig?.config?.branding || {};
  const headerData = coachConfig?.config?.header || {};
  const focusScreenshotUrl = coachConfig?.config?.focus_screenshot_url || null;

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
  return {
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
      app_logo_url: brandingData.app_logo_url || null,
      app_logo_size: brandingData.app_logo_size || "medium",
      primary_color: brandingData.primary_color || coach.theme_color || "#6366f1",
      theme_color: coach.theme_color,
      is_active: coach.is_active,
      monthly_price_cents: coach.user_monthly_price_cents,
      yearly_price_cents: coach.user_yearly_price_cents,
      tier3_name: coach.tier3_name || "Premium Plus",
      tier3_enabled: coach.tier3_enabled !== false,
      focus_screenshot_url: focusScreenshotUrl,
      companion_name: headerData.title || null,
      stripe_country: coach.stripe_country || null,
    },
    config,
    branding: brandingData,
  };
}
