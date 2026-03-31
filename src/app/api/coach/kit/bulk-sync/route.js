import { supabase } from "@/lib/supabase";
import { getCurrentUser } from "@/lib/auth";
import { decrypt } from "@/app/api/coach/kit/settings/route";
import { addSubscriberToKit } from "@/lib/kit";

// POST /api/coach/kit/bulk-sync
// Syncs all clients to Kit with an optional form and tags override
export async function POST(request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return Response.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { formId, tags = [] } = await request.json();

    // Get coach record with Kit settings
    const { data: coach } = await supabase
      .from("coaches")
      .select("id, business_name, kit_api_key, kit_enabled")
      .eq("profile_id", user.id)
      .single();

    if (!coach) {
      return Response.json({ error: "Coach not found" }, { status: 404 });
    }

    if (!coach.kit_api_key) {
      return Response.json(
        { error: "No Kit API key configured. Set it up in Settings." },
        { status: 400 },
      );
    }

    const apiKey = decrypt(coach.kit_api_key);
    if (!apiKey) {
      return Response.json({ error: "Failed to read Kit API key" }, { status: 500 });
    }

    // Fetch all clients for this coach
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("id, email, first_name, last_name")
      .eq("coach_id", coach.id)
      .eq("role", "user");

    if (profilesError) {
      return Response.json({ error: profilesError.message }, { status: 500 });
    }

    if (!profiles || profiles.length === 0) {
      return Response.json({ synced: 0, failed: 0, total: 0 });
    }

    // Sync each client — collect results
    let synced = 0;
    let failed = 0;
    const errors = [];

    for (const profile of profiles) {
      try {
        await addSubscriberToKit({
          apiKey,
          email: profile.email,
          firstName: profile.first_name || "",
          lastName: profile.last_name || "",
          tags: tags.length > 0 ? tags : [],
          formId: formId || null,
        });
        synced++;
      } catch (err) {
        failed++;
        errors.push({ email: profile.email, error: err.message });
        console.error(`[Kit Bulk Sync] Failed for ${profile.email}:`, err.message);
      }
    }

    return Response.json({ synced, failed, total: profiles.length, errors });
  } catch (error) {
    console.error("Kit bulk sync error:", error);
    return Response.json(
      { error: error.message || "Bulk sync failed" },
      { status: 500 },
    );
  }
}
