/**
 * Kit Sync Utilities
 * Handles syncing users to their coach's Kit account
 */

import { createClient } from "@supabase/supabase-js";
import { addSubscriberToKit } from "./kit";
import crypto from "crypto";

// Decryption function (must match encryption in settings route)
const ENCRYPTION_KEY =
  process.env.KIT_ENCRYPTION_KEY || "your-32-character-secret-key!!!";
const ALGORITHM = "aes-256-cbc";

function decrypt(text) {
  if (!text) return null;
  try {
    const parts = text.split(":");
    const iv = Buffer.from(parts.shift(), "hex");
    const encryptedText = parts.join(":");
    const key = Buffer.from(ENCRYPTION_KEY.padEnd(32, "0").slice(0, 32));
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    let decrypted = decipher.update(encryptedText, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
  } catch (error) {
    console.error("[Kit Sync] Decryption error:", error);
    return null;
  }
}

// Helper to get Supabase client
function getSupabaseClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
  );
}

/**
 * Sync a user to their coach's Kit account
 * @param {object} params - Sync parameters
 * @param {string} params.userId - User's profile ID
 * @param {string} params.coachId - Coach's ID
 * @param {string} params.email - User's email
 * @param {string} params.firstName - User's first name
 * @param {string} params.lastName - User's last name
 * @param {string} params.subscriptionStatus - User's subscription status
 * @returns {Promise<object>} Result with success status
 */
export async function syncUserToKit({
  userId,
  coachId,
  email,
  firstName,
  lastName,
  subscriptionStatus = "active",
}) {
  try {
    console.log("[Kit Sync] Starting sync for user:", {
      userId,
      coachId,
      email,
    });

    const supabase = getSupabaseClient();

    // Get coach's Kit settings
    const { data: coach, error: coachError } = await supabase
      .from("coaches")
      .select(
        "id, business_name, kit_enabled, kit_api_key, kit_form_id, kit_tags",
      )
      .eq("id", coachId)
      .single();

    if (coachError || !coach) {
      console.log("[Kit Sync] Coach not found or error:", coachError);
      return { success: false, error: "Coach not found" };
    }

    // Check if Kit is enabled for this coach
    if (!coach.kit_enabled) {
      console.log("[Kit Sync] Kit not enabled for this coach");
      return { success: false, error: "Kit integration not enabled" };
    }

    // Decrypt API key
    const apiKey = decrypt(coach.kit_api_key);
    if (!apiKey) {
      console.error("[Kit Sync] Failed to decrypt API key");

      // Update sync status
      await supabase
        .from("coaches")
        .update({
          kit_sync_status: "error",
          kit_error_message: "Failed to decrypt API key",
        })
        .eq("id", coach.id);

      return { success: false, error: "Invalid API key configuration" };
    }

    // Prepare tags
    let tags = [];
    try {
      tags = Array.isArray(coach.kit_tags)
        ? coach.kit_tags
        : JSON.parse(coach.kit_tags || "[]");
    } catch (e) {
      console.error("[Kit Sync] Error parsing tags:", e);
      tags = [];
    }

    // Add status tag
    tags.push(`status:${subscriptionStatus}`);

    // Add coach name tag
    if (coach.business_name) {
      tags.push(`coach:${coach.business_name}`);
    }

    // Add subscriber to Kit
    const kitResult = await addSubscriberToKit({
      apiKey,
      email,
      firstName: firstName || "",
      lastName: lastName || "",
      tags,
      formId: coach.kit_form_id || null,
    });

    // Update sync status
    await supabase
      .from("coaches")
      .update({
        kit_sync_status: "success",
        kit_last_sync: new Date().toISOString(),
        kit_error_message: null,
      })
      .eq("id", coach.id);

    console.log("[Kit Sync] Successfully synced user to Kit");
    return { success: true, data: kitResult };
  } catch (error) {
    console.error("[Kit Sync] Error syncing to Kit:", error);

    // Update sync status with error
    if (coachId) {
      await supabase
        .from("coaches")
        .update({
          kit_sync_status: "error",
          kit_error_message: error.message || "Unknown error",
        })
        .eq("id", coachId);
    }

    return { success: false, error: error.message };
  }
}

/**
 * Sync user by user ID (looks up all necessary data)
 * @param {string} userId - User's profile ID
 * @returns {Promise<object>} Result with success status
 */
export async function syncUserByUserId(userId) {
  try {
    const supabase = getSupabaseClient();

    // Get user data
    const { data: user, error: userError } = await supabase
      .from("profiles")
      .select("id, email, first_name, last_name, coach_id")
      .eq("id", userId)
      .single();

    if (userError || !user) {
      return { success: false, error: "User not found" };
    }

    if (!user.coach_id) {
      return { success: false, error: "User has no coach assigned" };
    }

    // Get subscription status
    const { data: subscription } = await supabase
      .from("user_subscriptions")
      .select("status")
      .eq("user_id", userId)
      .eq("coach_id", user.coach_id)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    return await syncUserToKit({
      userId: user.id,
      coachId: user.coach_id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      subscriptionStatus: subscription?.status || "inactive",
    });
  } catch (error) {
    console.error("[Kit Sync] Error in syncUserByUserId:", error);
    return { success: false, error: error.message };
  }
}
