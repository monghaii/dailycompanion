import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import jwt from "jsonwebtoken";

export async function POST(request) {
  try {
    const body = await request.json();
    const { password, accessToken } = body;

    if (!password) {
      return NextResponse.json(
        { error: "Password is required" },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    if (!accessToken) {
      return NextResponse.json(
        { error: "Invalid session. Please use the link from your email." },
        { status: 401 }
      );
    }

    // Decode the access token to get the user ID
    let userId;
    try {
      const decoded = jwt.decode(accessToken);
      userId = decoded?.sub;

      if (!userId) {
        throw new Error("Invalid token");
      }
    } catch (err) {
      return NextResponse.json(
        { error: "Invalid or expired reset link. Please request a new one." },
        { status: 401 }
      );
    }

    // Update the user's password using admin API
    const { error } = await supabase.auth.admin.updateUserById(userId, {
      password: password,
    });

    if (error) {
      throw new Error(error.message);
    }

    return NextResponse.json({
      success: true,
      message: "Password has been reset successfully.",
    });
  } catch (error) {
    console.error("Reset password error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to reset password" },
      { status: 500 }
    );
  }
}
