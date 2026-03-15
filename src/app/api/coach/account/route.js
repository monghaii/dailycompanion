import { NextResponse } from "next/server";
import { getCurrentUser, hashPassword, verifyPassword } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

export async function PATCH(request) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "coach") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { full_name, email, avatar_url, current_password, new_password } = body;

    const profileUpdates = {};
    const authUpdates = {};

    if (full_name !== undefined) {
      if (!full_name.trim()) {
        return NextResponse.json({ error: "Name cannot be empty" }, { status: 400 });
      }
      profileUpdates.full_name = full_name.trim();
    }

    if (avatar_url !== undefined) {
      profileUpdates.avatar_url = avatar_url;
    }

    if (email !== undefined && email !== user.email) {
      if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
      }

      const { data: existing } = await supabase
        .from("profiles")
        .select("id")
        .eq("email", email.toLowerCase())
        .neq("id", user.id)
        .maybeSingle();

      if (existing) {
        return NextResponse.json({ error: "This email is already in use" }, { status: 400 });
      }

      profileUpdates.email = email.toLowerCase();
      authUpdates.email = email.toLowerCase();
    }

    if (new_password) {
      if (!current_password) {
        return NextResponse.json({ error: "Current password is required" }, { status: 400 });
      }
      if (new_password.length < 8) {
        return NextResponse.json({ error: "New password must be at least 8 characters" }, { status: 400 });
      }

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: current_password,
      });

      if (signInError) {
        return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 });
      }

      authUpdates.password = new_password;
    }

    if (Object.keys(authUpdates).length > 0) {
      const { error: authError } = await supabase.auth.admin.updateUserById(user.id, authUpdates);
      if (authError) {
        console.error("Auth update error:", authError);
        return NextResponse.json({ error: "Failed to update credentials" }, { status: 500 });
      }
    }

    if (Object.keys(profileUpdates).length > 0) {
      const { error: profileError } = await supabase
        .from("profiles")
        .update(profileUpdates)
        .eq("id", user.id);

      if (profileError) {
        console.error("Profile update error:", profileError);
        return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
      }
    }

    const { data: updatedProfile } = await supabase
      .from("profiles")
      .select("id, email, full_name, first_name, last_name, avatar_url")
      .eq("id", user.id)
      .single();

    return NextResponse.json({ success: true, profile: updatedProfile });
  } catch (error) {
    console.error("Account update error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
