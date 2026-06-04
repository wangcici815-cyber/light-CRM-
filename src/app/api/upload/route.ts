import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-helpers";
import { getR2Client, isR2Configured } from "@/lib/r2";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    if (!file) {
      return NextResponse.json({ error: "请选择文件" }, { status: 400 });
    }

    const ext = file.name.split(".").pop() || "";
    const key = `uploads/${crypto.randomUUID()}.${ext}`;
    const fileType = file.type.startsWith("image/") ? "image" : "document";

    // Cloudflare R2 mode: generate presigned upload URL
    if (isR2Configured()) {
      const r2 = getR2Client()!;
      const command = new PutObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME,
        Key: key,
        ContentType: file.type,
      });

      const uploadUrl = await getSignedUrl(r2, command, { expiresIn: 3600 });
      const publicUrl = `${process.env.R2_PUBLIC_URL}/${key}`;

      return NextResponse.json({
        uploadUrl,
        publicUrl,
        r2Key: key,
        name: file.name,
        type: fileType,
        mode: "r2",
      });
    }

    // Local filesystem fallback (Node.js dev only)
    const fs = await import("fs/promises");
    const path = await import("path");

    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    await fs.mkdir(uploadsDir, { recursive: true });

    const safeName = `${file.name.split(".")[0]}-${Date.now()}.${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());
    await fs.writeFile(path.join(uploadsDir, safeName), buffer);

    return NextResponse.json({
      url: `/uploads/${safeName}`,
      name: file.name,
      type: fileType,
      mode: "local",
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "上传失败" }, { status: 500 });
  }
}
