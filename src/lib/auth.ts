import { NextResponse } from "next/server";
import { getAdminSession, getStudentSession } from "./session";
import { supabaseAdmin } from "./supabase/server";

export async function requireAdmin() {
  const session = await getAdminSession();
  if (!session || session.role !== "admin") {
    return { error: NextResponse.json({ error: "Unauthorized: admin login required." }, { status: 401 }) };
  }
  const db = supabaseAdmin();
  const { data: admin } = await db.from("admins").select("*").eq("id", session.sub).single();
  if (!admin) {
    return { error: NextResponse.json({ error: "Admin account not found." }, { status: 401 }) };
  }
  return { admin };
}

export async function requireStudent() {
  const session = await getStudentSession();
  if (!session || session.role !== "student") {
    return { error: NextResponse.json({ error: "Unauthorized: student login required." }, { status: 401 }) };
  }
  const db = supabaseAdmin();
  const { data: student } = await db.from("students").select("*").eq("id", session.sub).single();
  if (!student) {
    return { error: NextResponse.json({ error: "Student account not found." }, { status: 401 }) };
  }
  return { student };
}
