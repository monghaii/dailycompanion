import { supabase } from "@/lib/supabase";
import { requireAdmin } from "../../_auth";

export async function POST(request) {
  const deny = await requireAdmin();
  if (deny) return deny;

  try {
    const { coachSlug, action } = await request.json();

    if (!coachSlug || !action) {
      return Response.json({ error: "coachSlug and action are required" }, { status: 400 });
    }

    const { data: coach, error: fetchError } = await supabase
      .from("coaches")
      .select("id, business_name, slug, profiles:profile_id(email)")
      .eq("slug", coachSlug)
      .single();

    if (fetchError || !coach) {
      return Response.json({ error: `Coach "${coachSlug}" not found` }, { status: 404 });
    }

    let updates;
    if (action === "activate") {
      updates = {
        platform_subscription_status: "active",
        is_active: true,
        setup_fee_paid: true,
        setup_fee_paid_at: new Date().toISOString(),
        setup_fee_amount_cents: 50000,
      };
    } else if (action === "deactivate") {
      updates = {
        platform_subscription_status: "inactive",
        is_active: false,
      };
    } else {
      return Response.json({ error: `Unknown action: ${action}` }, { status: 400 });
    }

    const { error: updateError } = await supabase
      .from("coaches")
      .update(updates)
      .eq("id", coach.id);

    if (updateError) {
      return Response.json({ error: updateError.message }, { status: 500 });
    }

    return Response.json({
      success: true,
      coach: {
        slug: coach.slug,
        businessName: coach.business_name,
        email: coach.profiles?.email,
        newStatus: action === "activate" ? "active" : "inactive",
      },
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
