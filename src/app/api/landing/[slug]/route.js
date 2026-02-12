import { NextResponse } from "next/server";
import { getCoachLandingData } from "@/lib/coach-landing";

export async function GET(request, { params }) {
  try {
    const { slug } = await params;

    if (!slug) {
      return NextResponse.json({ error: "Slug is required" }, { status: 400 });
    }

    const data = await getCoachLandingData(slug);

    if (!data) {
      return NextResponse.json({ error: "Coach not found" }, { status: 404 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Landing config fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch landing page configuration" },
      { status: 500 },
    );
  }
}
