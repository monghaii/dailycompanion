import { supabase } from "@/lib/supabase";
import { getCurrentUser } from "@/lib/auth";
import { testKitConnection } from "@/lib/kit";
import crypto from "crypto";

const ENCRYPTION_KEY =
  process.env.KIT_ENCRYPTION_KEY || "your-32-character-secret-key!!!";
const ALGORITHM = "aes-256-cbc";

function encrypt(text) {
  if (!text) return null;
  const iv = crypto.randomBytes(16);
  const key = Buffer.from(ENCRYPTION_KEY.padEnd(32, "0").slice(0, 32));
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  return iv.toString("hex") + ":" + encrypted;
}

function decrypt(text) {
  if (!text) return null;
  const parts = text.split(":");
  const iv = Buffer.from(parts.shift(), "hex");
  const encryptedText = parts.join(":");
  const key = Buffer.from(ENCRYPTION_KEY.padEnd(32, "0").slice(0, 32));
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  let decrypted = decipher.update(encryptedText, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}

export async function POST(request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return Response.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { kitApiKey, kitEnabled, kitFormId, kitTags } =
      await request.json();

    const { data: coach } = await supabase
      .from("coaches")
      .select("id")
      .eq("profile_id", user.id)
      .single();

    if (!coach) {
      return Response.json({ error: "Coach not found" }, { status: 404 });
    }

    if (kitEnabled && kitApiKey) {
      const testResult = await testKitConnection(kitApiKey);
      if (!testResult.success) {
        return Response.json(
          { error: "Invalid Kit API key", details: testResult.error },
          { status: 400 },
        );
      }
    }

    const updateData = {
      kit_enabled: kitEnabled || false,
      kit_form_id: kitFormId || null,
      kit_tags: kitTags ? JSON.stringify(kitTags) : "[]",
      updated_at: new Date().toISOString(),
    };

    if (kitApiKey) {
      updateData.kit_api_key = encrypt(kitApiKey);
    }

    const { error: updateError } = await supabase
      .from("coaches")
      .update(updateData)
      .eq("id", coach.id);

    if (updateError) {
      console.error("Error updating Kit settings:", updateError);
      return Response.json(
        { error: "Failed to save Kit settings" },
        { status: 500 },
      );
    }

    return Response.json({
      success: true,
      message: "Kit settings saved successfully",
    });
  } catch (error) {
    console.error("Kit settings save error:", error);
    return Response.json(
      { error: error.message || "Failed to save Kit settings" },
      { status: 500 },
    );
  }
}

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return Response.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { data: coach } = await supabase
      .from("coaches")
      .select(
        "kit_enabled, kit_form_id, kit_tags, kit_last_sync, kit_sync_status, kit_error_message",
      )
      .eq("profile_id", user.id)
      .single();

    if (!coach) {
      return Response.json({ error: "Coach not found" }, { status: 404 });
    }

    return Response.json({
      kitEnabled: coach.kit_enabled || false,
      kitFormId: coach.kit_form_id || "",
      kitTags: coach.kit_tags || [],
      kitHasApiKey: false,
      kitLastSync: coach.kit_last_sync,
      kitSyncStatus: coach.kit_sync_status,
      kitErrorMessage: coach.kit_error_message,
    });
  } catch (error) {
    console.error("Kit settings fetch error:", error);
    return Response.json(
      { error: error.message || "Failed to fetch Kit settings" },
      { status: 500 },
    );
  }
}

export { encrypt, decrypt };
