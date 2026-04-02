import { supabase } from "@/lib/supabase";
import { requireAdmin } from "../_auth";

export async function GET() {
  const deny = await requireAdmin();
  if (deny) return deny;

  const { data: coaches, error } = await supabase
    .from("coaches")
    .select(`
      id,
      slug,
      business_name,
      platform_subscription_status,
      is_active,
      setup_fee_paid,
      stripe_customer_id,
      created_at,
      profiles:profile_id (
        email,
        full_name
      )
    `)
    .order("created_at", { ascending: false });

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ coaches });
}
