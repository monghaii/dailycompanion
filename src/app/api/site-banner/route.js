import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

export async function GET() {
  try {
    const { data, error } = await supabase
      .from("site_banners")
      .select("id, message, banner_type")
      .eq("is_active", true)
      .neq("message", "")
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== "PGRST116") {
      // PGRST116 = no rows found, which is fine
      console.error("Error fetching site banner:", error);
      return NextResponse.json({ banner: null });
    }

    return NextResponse.json({ banner: data || null });
  } catch (err) {
    console.error("Site banner error:", err);
    return NextResponse.json({ banner: null });
  }
}
