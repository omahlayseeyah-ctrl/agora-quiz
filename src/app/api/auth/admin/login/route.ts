import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { verifyPassword } from "@/lib/password";
import { createAdminSession } from "@/lib/session";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const username = (body.username || "").trim().toLowerCase();
    const password = body.password || "";

    if (!username || !password) {
      return NextResponse.json({ error: "Please enter username and password." }, { status: 400 });
    }

    const db = supabaseAdmin();
    const { data: admin } = await db.from("admins").select("*").eq("username", username).maybeSingle();

    if (!admin) {
      return NextResponse.json({ error: "Invalid administrator credentials." }, { status: 401 });
    }

    const ok = await verifyPassword(password, admin.password_hash);
    if (!ok) {
      return NextResponse.json({ error: "Invalid administrator credentials." }, { status: 401 });
    }

    await createAdminSession(admin.id);

    return NextResponse.json({
      admin: { id: admin.id, username: admin.username, mustChangePassword: admin.must_change_password },
    });
  } catch (err) {
    return NextResponse.json({ error: "Unexpected error during login." }, { status: 500 });
  }
}
