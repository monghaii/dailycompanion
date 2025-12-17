import { createClient } from "@supabase/supabase-js";

// Client-side Supabase client - only for direct client access when needed
// Uses server-side env vars through API routes by default
export function getSupabaseClient() {
  // Check if we're in the browser
  if (typeof window === "undefined") {
    throw new Error("getSupabaseClient should only be called client-side");
  }

  // For password reset, we'll use a lightweight client that just handles the URL hash
  // The actual password update will be done through API routes
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

  if (!supabaseUrl || !supabaseAnonKey) {
    // Return null - components should handle password reset via API routes
    return null;
  }

  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
  });
}
