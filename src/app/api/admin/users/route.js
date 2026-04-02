import { supabase } from "@/lib/supabase";
import { requireAdmin } from "../_auth";

export async function GET() {
  const deny = await requireAdmin();
  if (deny) return deny;

  const { data: profiles, error } = await supabase
    .from("profiles")
    .select(`
      id,
      email,
      full_name,
      is_test_premium,
      role,
      created_at,
      user_subscriptions (
        status,
        subscription_tier,
        current_period_end,
        canceled_at
      )
    `)
    .eq("role", "user")
    .order("created_at", { ascending: false });

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  const users = profiles.map((p) => {
    const activeSub = p.user_subscriptions?.find((s) => s.status === "active");
    return {
      id: p.id,
      email: p.email,
      fullName: p.full_name,
      isTestPremium: p.is_test_premium || false,
      createdAt: p.created_at,
      subscription: activeSub
        ? {
            status: activeSub.status,
            tier: activeSub.subscription_tier,
            currentPeriodEnd: activeSub.current_period_end,
            canceledAt: activeSub.canceled_at,
          }
        : null,
    };
  });

  return Response.json({ users });
}
