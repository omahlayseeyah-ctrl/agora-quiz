import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { hashPassword } from "@/lib/password";
import { createStudentSession } from "@/lib/session";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const firstName = (body.firstName || "").trim();
    const lastName = (body.lastName || "").trim();
    const username = (body.username || "").trim().toLowerCase();
    const phoneNumber = (body.phoneNumber || "").trim();
    const email = (body.email || "").trim().toLowerCase();
    const password = body.password || "";

    if (!firstName || !lastName || !username || !phoneNumber || !email || !password) {
      return NextResponse.json({ error: "All fields are required." }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters." }, { status: 400 });
    }
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email)) {
      return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
    }

    const db = supabaseAdmin();

    const { data: existingUsername } = await db
      .from("students")
      .select("id")
      .eq("username", username)
      .maybeSingle();
    if (existingUsername) {
      return NextResponse.json({ error: "This username is already taken." }, { status: 409 });
    }

    const { data: existingEmail } = await db
      .from("students")
      .select("id")
      .eq("email", email)
      .maybeSingle();
    if (existingEmail) {
      return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 });
    }

    const passwordHash = await hashPassword(password);

    const { data: student, error } = await db
      .from("students")
      .insert({
        first_name: firstName,
        last_name: lastName,
        username,
        phone_number: phoneNumber,
        email,
        password_hash: passwordHash,
      })
      .select()
      .single();

    if (error || !student) {
      return NextResponse.json({ error: "Could not create account. Please try again." }, { status: 500 });
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
    return NextResponse.json({ error: "Unexpected error during registration." }, { status: 500 });
  }
}
