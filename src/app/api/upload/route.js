import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

export async function POST(request) {
  try {
    const user = await getCurrentUser();

    if (!user || user.role !== "coach") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get the coach record to ensure user is a coach
    const { data: coach } = await supabase
      .from("coaches")
      .select("id")
      .eq("profile_id", user.id)
      .single();

    if (!coach) {
      return NextResponse.json(
        { error: "Coach profile not found" },
        { status: 404 }
      );
    }

    // Parse the form data
    const formData = await request.formData();
    const file = formData.get("file");
    const fileType = formData.get("type"); // 'logo', 'audio', 'video', etc.

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file size based on type
    const sizeLimits = {
      logo: 5 * 1024 * 1024,
      screenshot: 5 * 1024 * 1024,
      audio: 50 * 1024 * 1024,
      video: 100 * 1024 * 1024,
      pdf: 20 * 1024 * 1024,
    };
    const maxSize = sizeLimits[fileType] || 5 * 1024 * 1024;
    if (file.size > maxSize) {
      const sizeLabel = maxSize >= 1024 * 1024 ? `${maxSize / (1024 * 1024)}MB` : `${maxSize / 1024}KB`;
      return NextResponse.json(
        { error: `File size exceeds ${sizeLabel} limit` },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = {
      logo: ["image/jpeg", "image/png", "image/gif", "image/webp"],
      audio: [
        "audio/mpeg",
        "audio/wav",
        "audio/mp3",
        "audio/mp4",
        "audio/x-m4a",
      ],
      video: ["video/mp4", "video/webm", "video/quicktime"],
      pdf: ["application/pdf"],
    };

    const acceptedTypes = allowedTypes[fileType] || allowedTypes.logo;
    if (!acceptedTypes.includes(file.type)) {
      return NextResponse.json(
        {
          error: `Invalid file type. Accepted types: ${acceptedTypes.join(
            ", "
          )}`,
        },
        { status: 400 }
      );
    }

    // Generate unique filename
    const timestamp = Date.now();
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const fileName = `${timestamp}-${sanitizedName}`;
    const filePath = `${user.id}/${fileType || "uploads"}/${fileName}`;

    // Determine which bucket to use
    // Logos and screenshots go to public bucket, everything else to private bucket
    const bucketName = (fileType === "logo" || fileType === "screenshot") ? "coach-public" : "coach-content";

    // Convert File to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      return NextResponse.json(
        { error: "Failed to upload file: " + uploadError.message },
        { status: 500 }
      );
    }

    // Get URL based on bucket type
    let url;
    if (bucketName === "coach-public") {
      // Public bucket - use public URL
      const { data: urlData } = supabase.storage
        .from(bucketName)
        .getPublicUrl(filePath);
      url = urlData.publicUrl;
    } else {
      // Private bucket - use signed URL (valid for 1 year for now)
      // TODO: Implement subscription verification before generating URLs
      const { data: urlData, error: urlError } = await supabase.storage
        .from(bucketName)
        .createSignedUrl(filePath, 31536000); // 1 year in seconds

      if (urlError) {
        console.error("Error creating signed URL:", urlError);
        return NextResponse.json(
          { error: "Failed to generate access URL" },
          { status: 500 }
        );
      }
      url = urlData.signedUrl;
    }

    return NextResponse.json({
      success: true,
      url: url,
      path: filePath,
      fileName: fileName,
      bucket: bucketName,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Internal server error: " + error.message },
      { status: 500 }
    );
  }
}

// DELETE endpoint to remove uploaded files
export async function DELETE(request) {
  try {
    const user = await getCurrentUser();

    if (!user || user.role !== "coach") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { filePath } = await request.json();

    if (!filePath) {
      return NextResponse.json(
        { error: "File path required" },
        { status: 400 }
      );
    }

    // Verify the file belongs to this user
    if (!filePath.startsWith(`${user.id}/`)) {
      return NextResponse.json(
        { error: "You can only delete your own files" },
        { status: 403 }
      );
    }

    // Determine bucket from file path (logos are in public, others in content)
    const bucketName = filePath.includes("/logo/")
      ? "coach-public"
      : "coach-content";

    // Delete from storage
    const { error: deleteError } = await supabase.storage
      .from(bucketName)
      .remove([filePath]);

    if (deleteError) {
      console.error("Delete error:", deleteError);
      return NextResponse.json(
        { error: "Failed to delete file" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
