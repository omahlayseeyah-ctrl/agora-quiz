import { NextResponse } from "next/server";
import { requireStudent } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/server";

export async function POST() {
  const auth = await requireStudent();
  if ("error" in auth) return auth.error;

  const db = supabaseAdmin();
  await db.from("students").update({ has_seen_whatsapp_instructions: true }).eq("id", auth.student.id);
  return NextResponse.json({ ok: true });
}
