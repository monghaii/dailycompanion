import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

export async function POST(request) {
  try {
    const user = await getCurrentUser();

    if (!user || user.role !== "coach") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { filePath, bucketName } = await request.json();

    if (!filePath || !bucketName) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    if (!filePath.startsWith(`${user.id}/`)) {
      return NextResponse.json(
        { error: "Invalid file path" },
        { status: 403 },
      );
    }

    let url;
    if (bucketName === "coach-public") {
      const { data: urlData } = supabase.storage
        .from(bucketName)
        .getPublicUrl(filePath);
      url = urlData.publicUrl;
    } else {
      const { data: urlData, error: urlError } = await supabase.storage
        .from(bucketName)
        .createSignedUrl(filePath, 31536000);

      if (urlError) {
        console.error("Error creating signed URL:", urlError);
        return NextResponse.json(
          { error: "Failed to generate access URL" },
          { status: 500 },
        );
      }
      url = urlData.signedUrl;
    }

    return NextResponse.json({
      success: true,
      url,
      path: filePath,
      bucket: bucketName,
    });
  } catch (error) {
    console.error("Complete upload error:", error);
    return NextResponse.json(
      { error: "Internal server error: " + error.message },
      { status: 500 },
    );
  }
}
