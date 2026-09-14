import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { verifyPassword } from "@/lib/password";
import { createStudentSession } from "@/lib/session";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const identifier = (body.identifier || "").trim().toLowerCase();
    const password = body.password || "";

    if (!identifier || !password) {
      return NextResponse.json({ error: "Please enter your username/email and password." }, { status: 400 });
    }

    const db = supabaseAdmin();
    const { data: student } = await db
      .from("students")
      .select("*")
      .or(`username.eq.${identifier},email.eq.${identifier}`)
      .maybeSingle();

    if (!student) {
      return NextResponse.json({ error: "Invalid login credentials." }, { status: 401 });
    }

    const ok = await verifyPassword(password, student.password_hash);
    if (!ok) {
      return NextResponse.json({ error: "Invalid login credentials." }, { status: 401 });
    }

    await createStudentSession(student.id);

    return NextResponse.json({
      student: {
        id: student.id,
        firstName: student.first_name,
        lastName: student.last_name,
        username: student.username,
        email: student.email,
      },
    });
  } catch (err) {
    return NextResponse.json({ error: "Unexpected error during login." }, { status: 500 });
  }
}
