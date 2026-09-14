import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { requireStudent } from "@/lib/auth";
import { finalizeAttempt } from "@/lib/scoring";

export async function POST(req: NextRequest, { params }: { params: { attemptId: string } }) {
  const auth = await requireStudent();
  if ("error" in auth) return auth.error;

  const body = await req.json();
  const questionId = body.questionId;
  const selectedAnswer = body.selectedAnswer; // "A" | "B" | "C" | "D" | null

  if (!questionId) return NextResponse.json({ error: "questionId is required." }, { status: 400 });
  if (selectedAnswer && !["A", "B", "C", "D"].includes(selectedAnswer)) {
    return NextResponse.json({ error: "Invalid answer option." }, { status: 400 });
  }

  const db = supabaseAdmin();
  const { data: attempt } = await db.from("attempts").select("*").eq("id", params.attemptId).single();

  if (!attempt || attempt.student_id !== auth.student.id) {
    return NextResponse.json({ error: "Attempt not found." }, { status: 404 });
  }
  if (attempt.status !== "in_progress") {
    return NextResponse.json({ error: "This attempt has already been submitted." }, { status: 409 });
  }
  if (new Date(attempt.ends_at) <= new Date()) {
    await finalizeAttempt(db, attempt.id);
    return NextResponse.json({ error: "Time is up. Your quiz has been auto-submitted.", expired: true }, { status: 409 });
  }

  const { data: question } = await db
    .from("questions")
    .select("id, correct_answer")
    .eq("id", questionId)
    .eq("quiz_id", attempt.quiz_id)
    .single();
  if (!question) return NextResponse.json({ error: "Question not found for this quiz." }, { status: 404 });

  const isCorrect = selectedAnswer ? selectedAnswer === question.correct_answer : null;

  const { error } = await db.from("attempt_answers").upsert(
    {
      attempt_id: attempt.id,
      question_id: questionId,
      selected_answer: selectedAnswer || null,
      is_correct: isCorrect,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "attempt_id,question_id" }
  );

  if (error) return NextResponse.json({ error: "Could not save your answer." }, { status: 500 });
  return NextResponse.json({ ok: true });
}
