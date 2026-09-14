import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";

const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/jpg", "image/webp", "image/gif"];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

export async function POST(req: NextRequest) {
  const result = await requireAdmin();
  if ("error" in result) return result.error;

  const formData = await req.formData();
  const file = formData.get("file") as File | null;

  if (!file) return NextResponse.json({ error: "No file was uploaded." }, { status: 400 });
  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: "Only PNG, JPG, WEBP or GIF images are allowed." }, { status: 400 });
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: "Image must be smaller than 5MB." }, { status: 400 });
  }

  const bucket = process.env.SUPABASE_STORAGE_BUCKET || "agora-quiz-media";
  const db = supabaseAdmin();
  const ext = file.name.split(".").pop() || "png";
  const path = `question-images/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

  const arrayBuffer = await file.arrayBuffer();
  const { error } = await db.storage.from(bucket).upload(path, Buffer.from(arrayBuffer), {
    contentType: file.type,
    upsert: false,
  });

  if (error) {
    return NextResponse.json({ error: "Could not upload image. Check that the storage bucket exists and is public." }, { status: 500 });
  }

  const { data: publicUrl } = db.storage.from(bucket).getPublicUrl(path);
  return NextResponse.json({ url: publicUrl.publicUrl });
}
