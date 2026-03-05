import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

export async function POST(request) {
  try {
    const user = await getCurrentUser();

    if (!user || user.role !== "coach") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: coach } = await supabase
      .from("coaches")
      .select("id")
      .eq("profile_id", user.id)
      .single();

    if (!coach) {
      return NextResponse.json(
        { error: "Coach profile not found" },
        { status: 404 },
      );
    }

    const { fileName, fileType, fileSize, contentType } = await request.json();

    if (!fileName || !fileType || !contentType) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    const maxSize = 4.5 * 1024 * 1024;
    if (fileSize > maxSize) {
      const sizeLabel =
        maxSize >= 1024 * 1024
          ? `${maxSize / (1024 * 1024)}MB`
          : `${maxSize / 1024}KB`;
      return NextResponse.json(
        { error: `File size exceeds ${sizeLabel} limit` },
        { status: 400 },
      );
    }

    const allowedTypes = {
      logo: ["image/jpeg", "image/png", "image/gif", "image/webp"],
      audio: ["audio/mpeg", "audio/wav", "audio/mp3", "audio/mp4", "audio/x-m4a"],
      video: ["video/mp4", "video/webm", "video/quicktime"],
      pdf: ["application/pdf"],
    };

    const acceptedTypes = allowedTypes[fileType] || allowedTypes.logo;
    if (!acceptedTypes.includes(contentType)) {
      return NextResponse.json(
        { error: `Invalid file type. Accepted: ${acceptedTypes.join(", ")}` },
        { status: 400 },
      );
    }

    const timestamp = Date.now();
    const sanitizedName = fileName.replace(/[^a-zA-Z0-9.-]/g, "_");
    const fullFileName = `${timestamp}-${sanitizedName}`;
    const filePath = `${user.id}/${fileType || "uploads"}/${fullFileName}`;

    const bucketName =
      fileType === "logo" || fileType === "screenshot"
        ? "coach-public"
        : "coach-content";

    const { data, error } = await supabase.storage
      .from(bucketName)
      .createSignedUploadUrl(filePath);

    if (error) {
      console.error("Presign error:", error);
      return NextResponse.json(
        { error: "Failed to create upload URL: " + error.message },
        { status: 500 },
      );
    }

    return NextResponse.json({
      signedUrl: data.signedUrl,
      token: data.token,
      filePath,
      bucketName,
    });
  } catch (error) {
    console.error("Presign error:", error);
    return NextResponse.json(
      { error: "Internal server error: " + error.message },
      { status: 500 },
    );
  }
}
