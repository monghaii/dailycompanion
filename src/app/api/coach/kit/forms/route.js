import { supabase } from "@/lib/supabase";
import { getCurrentUser } from "@/lib/auth";
import { decrypt } from "@/app/api/coach/kit/settings/route";

const KIT_BASE = "https://api.kit.com/v4";

async function fetchForms(apiKey) {
  const res = await fetch(`${KIT_BASE}/forms?status=active&per_page=100`, {
    headers: { "X-Kit-Api-Key": apiKey, "Content-Type": "application/json" },
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.errors?.[0] || "Failed to fetch forms from Kit");
  }

  const data = await res.json();
  return (data.forms || []).map((f) => ({
    id: String(f.id),
    name: f.name,
    type: f.type,
  }));
}

// POST /api/coach/kit/forms - Fetch forms using a provided (unsaved) API key
export async function POST(request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return Response.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { apiKey } = await request.json();
    if (!apiKey) {
      return Response.json({ error: "API key is required" }, { status: 400 });
    }

    const forms = await fetchForms(apiKey);
    return Response.json({ forms });
  } catch (error) {
    console.error("Kit forms fetch error:", error);
    return Response.json(
      { error: error.message || "Failed to fetch Kit forms" },
      { status: 500 },
    );
  }
}

// GET /api/coach/kit/forms - Fetch forms using the saved API key
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return Response.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { data: coach } = await supabase
      .from("coaches")
      .select("kit_api_key")
      .eq("profile_id", user.id)
      .single();

    if (!coach?.kit_api_key) {
      return Response.json({ error: "No Kit API key saved" }, { status: 400 });
    }

    const apiKey = decrypt(coach.kit_api_key);
    if (!apiKey) {
      return Response.json({ error: "Failed to read API key" }, { status: 500 });
    }

    const forms = await fetchForms(apiKey);
    return Response.json({ forms });
  } catch (error) {
    console.error("Kit forms fetch error:", error);
    return Response.json(
      { error: error.message || "Failed to fetch Kit forms" },
      { status: 500 },
    );
  }
}
