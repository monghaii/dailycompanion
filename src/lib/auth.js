import { supabase } from "./supabase";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

const JWT_SECRET =
  process.env.JWT_SECRET || "your-secret-key-change-in-production";
const TOKEN_EXPIRY = "7d";

// Hash password
export async function hashPassword(password) {
  return bcrypt.hash(password, 12);
}

// Verify password
export async function verifyPassword(password, hashedPassword) {
  return bcrypt.compare(password, hashedPassword);
}

// Generate JWT token
export function generateToken(userId) {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });
}

// Verify JWT token
export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}

// Create a new user (coach or regular user)
export async function createUser({ email, password, fullName, firstName, lastName, role = "user", coachId = null, tokenLimit = 1000000 }) {
  // Check if user already exists
  const { data: existingUser } = await supabase
    .from("profiles")
    .select("id")
    .eq("email", email)
    .single();

  if (existingUser) {
    throw new Error("User already exists");
  }

  // Create user in Supabase Auth
  const { data: authData, error: authError } =
    await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

  if (authError) {
    throw new Error(authError.message);
  }

  const resolvedFirst = firstName || "";
  const resolvedLast = lastName || "";
  const resolvedFull = fullName || `${resolvedFirst} ${resolvedLast}`.trim();

  const profileData = {
    id: authData.user.id,
    email,
    full_name: resolvedFull,
    first_name: resolvedFirst,
    last_name: resolvedLast,
    role,
    token_limit: tokenLimit,
  };

  if (coachId) {
    profileData.coach_id = coachId;
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .insert(profileData)
    .select()
    .single();

  if (profileError) {
    // Rollback: delete auth user if profile creation fails
    await supabase.auth.admin.deleteUser(authData.user.id);
    throw new Error(profileError.message);
  }

  return profile;
}

// Sign in user
export async function signIn({ email, password }) {
  // First verify password with Supabase Auth
  const { data: authData, error: authError } =
    await supabase.auth.signInWithPassword({
      email,
      password,
    });

  if (authError) {
    throw new Error("Invalid email or password");
  }

  // Then get user profile using the ID from auth (more reliable than email)
  // Use .maybeSingle() instead of .single() to avoid errors if no rows found
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", authData.user.id)
    .maybeSingle();

  if (profileError) {
    throw new Error(
      "Database error. Please check RLS policies on profiles table."
    );
  }

  if (!profile) {
    throw new Error("Profile not found. Please sign up first.");
  }

  // Generate session token
  const token = generateToken(profile.id);

  // Store session
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  await supabase.from("sessions").insert({
    user_id: profile.id,
    token,
    expires_at: expiresAt.toISOString(),
  });

  return { profile, token };
}

// Get current user from request
export async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;

  if (!token) {
    return null;
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    return null;
  }

  // Verify session exists and is not expired
  const { data: session } = await supabase
    .from("sessions")
    .select("*")
    .eq("token", token)
    .gt("expires_at", new Date().toISOString())
    .single();

  if (!session) {
    return null;
  }

  // Get user profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", decoded.userId)
    .single();

  return profile;
}

// Get current user with coach data if applicable
export async function getCurrentUserWithCoach() {
  const profile = await getCurrentUser();

  if (!profile) {
    return null;
  }

  if (profile.role === "coach") {
    const { data: coach } = await supabase
      .from("coaches")
      .select("*")
      .eq("profile_id", profile.id)
      .single();

    return { ...profile, coach };
  }

  return profile;
}

// Sign out user
export async function signOut() {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;

  if (token) {
    await supabase.from("sessions").delete().eq("token", token);
  }
}

// Create coach record after signup
export async function createCoach({ profileId, slug, businessName }) {
  // Check if slug is available
  const { data: existingCoach } = await supabase
    .from("coaches")
    .select("id")
    .eq("slug", slug)
    .single();

  if (existingCoach) {
    throw new Error("This URL is already taken");
  }

  const { data: coach, error } = await supabase
    .from("coaches")
    .insert({
      profile_id: profileId,
      slug,
      business_name: businessName,
    })
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return coach;
}

// Get coach by slug
export async function getCoachBySlug(slug) {
  const { data: coach, error } = await supabase
    .from("coaches")
    .select("*")
    .eq("slug", slug)
    .single();

  if (error) {
    console.error("getCoachBySlug error:", error);
    return null;
  }

  return coach;
}

// Get user's subscription to a coach
export async function getUserSubscription(userId, coachId) {
  const { data: subscription } = await supabase
    .from("user_subscriptions")
    .select("*")
    .eq("user_id", userId)
    .eq("coach_id", coachId)
    .single();

  return subscription;
}

// Request password reset
export async function requestPasswordReset(email) {
  // Check if user exists
  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("email", email)
    .single();

  if (!profile) {
    // Don't reveal if user exists or not for security
    return { success: true };
  }

  // Send password reset email using Supabase Auth
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/reset-password`,
  });

  if (error) {
    throw new Error(error.message);
  }

  return { success: true };
}

// Update password using reset token
export async function updatePassword(newPassword) {
  const { error } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (error) {
    throw new Error(error.message);
  }

  return { success: true };
}
