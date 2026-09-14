import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";

// Toggle a quiz between "published" (student-accessible) and "unpublished".
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const result = await requireAdmin();
  if ("error" in result) return result.error;

  const body = await req.json().catch(() => ({}));
  const db = supabaseAdmin();

  const { data: quiz } = await db.from("quizzes").select("status").eq("id", params.id).single();
  if (!quiz) return NextResponse.json({ error: "Quiz not found." }, { status: 404 });

  const nextStatus = body.publish === false ? "unpublished" : "published";

  if (nextStatus === "published") {
    const { count } = await db
      .from("questions")
      .select("*", { count: "exact", head: true })
      .eq("quiz_id", params.id);
    if (!count) {
      return NextResponse.json({ error: "Add at least one question before publishing." }, { status: 400 });
    }
  }

  const { error } = await db.from("quizzes").update({ status: nextStatus }).eq("id", params.id);
  if (error) return NextResponse.json({ error: "Could not update publish status." }, { status: 500 });

  return NextResponse.json({ ok: true, status: nextStatus });
}
