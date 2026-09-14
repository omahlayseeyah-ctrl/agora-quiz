import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { requireStudent } from "@/lib/auth";
import { finalizeAttempt } from "@/lib/scoring";

export async function POST(req: NextRequest, { params }: { params: { attemptId: string } }) {
  const auth = await requireStudent();
  if ("error" in auth) return auth.error;

  const db = supabaseAdmin();
  const { data: attempt } = await db.from("attempts").select("*").eq("id", params.attemptId).single();

  if (!attempt || attempt.student_id !== auth.student.id) {
    return NextResponse.json({ error: "Attempt not found." }, { status: 404 });
  }

  if (attempt.status === "submitted") {
    return NextResponse.json({ attempt });
  }

  const updated = await finalizeAttempt(db, attempt.id);

  const { data: quiz } = await db
    .from("quizzes")
    .select("results_visibility, slug")
    .eq("id", attempt.quiz_id)
    .single();

  return NextResponse.json({
    attempt: updated,
    resultsVisible: quiz?.results_visibility === "public",
    quizSlug: quiz?.slug,
  });
}
