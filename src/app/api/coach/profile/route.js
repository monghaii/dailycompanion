import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

export async function PATCH(request) {
  try {
    const user = await getCurrentUser();

    if (!user || user.role !== "coach") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { business_name, slug, bio, user_monthly_price_cents, logo_url } =
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
      user_monthly_price_cents,
      updated_at: new Date().toISOString(),
    };

    // Only update logo_url if provided
    if (logo_url !== undefined) {
      updateData.logo_url = logo_url;
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

    return NextResponse.json({ coach: updatedCoach });
  } catch (error) {
    console.error("Update profile error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
