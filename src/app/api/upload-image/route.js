import { bucket } from "@/lib/gcs";
import { randomUUID } from "crypto";

export async function POST(req) {
  try {
    const formData = await req.formData();
    const file = formData.get("file");

    if (!file) {
      return Response.json({ error: "File missing" }, { status: 400 });
    }

    // optional: allow only images
    if (!file.type.startsWith("image/")) {
      return Response.json(
        { error: "Only image uploads allowed" },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const ext = file.name.split(".").pop();

    const fileName = `blog/${randomUUID()}.${ext}`;
    const blob = bucket.file(fileName);

    await blob.save(buffer, {
      resumable: false,
      metadata: {
        contentType: file.type,
        cacheControl: "public, max-age=31536000",
      },
    });

    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;

    return Response.json({
      success: true,
      url: publicUrl,
    });
  } catch (err) {
    console.error("Upload error:", err);
    return Response.json(
      { error: "Upload failed" },
      { status: 500 }
    );
  }
}
