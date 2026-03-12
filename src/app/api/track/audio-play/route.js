import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { incrementAudioPlayCount } from "@/lib/analytics-aggregates";

export async function POST(request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (user.role === "coach") {
      return NextResponse.json({ tracked: false });
    }

    const { audio_path, audio_name } = await request.json();

    if (!audio_path) {
      return NextResponse.json(
        { error: "audio_path is required" },
        { status: 400 },
      );
    }

    incrementAudioPlayCount(user.id, audio_path, audio_name || "").catch(() => {});

    return NextResponse.json({ tracked: true });
  } catch (error) {
    console.error("Track audio play error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
