import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/server";
import { hashPassword, verifyPassword } from "@/lib/password";

export async function POST(req: NextRequest) {
  const result = await requireAdmin();
  if ("error" in result) return result.error;
  const { admin } = result;

  const body = await req.json();
  const currentPassword = body.currentPassword || "";
  const newPassword = body.newPassword || "";

  if (!newPassword || newPassword.length < 8) {
    return NextResponse.json({ error: "New password must be at least 8 characters." }, { status: 400 });
  }

  const ok = await verifyPassword(currentPassword, admin.password_hash);
  if (!ok) {
    return NextResponse.json({ error: "Current password is incorrect." }, { status: 401 });
  }

  const db = supabaseAdmin();
  const newHash = await hashPassword(newPassword);
  const { error } = await db
    .from("admins")
    .update({ password_hash: newHash, must_change_password: false })
    .eq("id", admin.id);

  if (error) {
    return NextResponse.json({ error: "Could not update password." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
