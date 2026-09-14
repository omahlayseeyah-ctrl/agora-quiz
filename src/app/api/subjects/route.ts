import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";

export async function GET() {
  const db = supabaseAdmin();
  const { data, error } = await db.from("subjects").select("*").order("name");
  if (error) return NextResponse.json({ error: "Could not load subjects." }, { status: 500 });
  return NextResponse.json({ subjects: data });
}

export async function POST(req: NextRequest) {
  const result = await requireAdmin();
  if ("error" in result) return result.error;

  const body = await req.json();
  const name = (body.name || "").trim();
  if (!name) return NextResponse.json({ error: "Subject name is required." }, { status: 400 });

  const db = supabaseAdmin();
  const { data, error } = await db.from("subjects").insert({ name }).select().single();
  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ error: "This subject already exists." }, { status: 409 });
    }
    return NextResponse.json({ error: "Could not create subject." }, { status: 500 });
  }
  return NextResponse.json({ subject: data });
}
