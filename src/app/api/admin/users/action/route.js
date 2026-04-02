import { supabase } from "@/lib/supabase";
import { requireAdmin } from "../../_auth";

export async function POST(request) {
  const deny = await requireAdmin();
  if (deny) return deny;

  try {
    const { userId, action } = await request.json();

    if (!userId || !action) {
      return Response.json({ error: "userId and action are required" }, { status: 400 });
    }

    let isTestPremium;
    if (action === "upgrade") {
      isTestPremium = true;
    } else if (action === "downgrade") {
      isTestPremium = false;
    } else {
      return Response.json({ error: `Unknown action: ${action}` }, { status: 400 });
    }

    const { data: profile, error: fetchError } = await supabase
      .from("profiles")
      .select("id, email, full_name")
      .eq("id", userId)
      .eq("role", "user")
      .single();

    if (fetchError || !profile) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }

    const { error: updateError } = await supabase
      .from("profiles")
      .update({ is_test_premium: isTestPremium })
      .eq("id", userId);

    if (updateError) {
      return Response.json({ error: updateError.message }, { status: 500 });
    }

    return Response.json({
      success: true,
      user: {
        id: profile.id,
        email: profile.email,
        fullName: profile.full_name,
        isTestPremium,
      },
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
