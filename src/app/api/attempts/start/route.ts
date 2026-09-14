import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { requireStudent } from "@/lib/auth";
import { finalizeAttempt } from "@/lib/scoring";

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export async function POST(req: NextRequest) {
  const auth = await requireStudent();
  if ("error" in auth) return auth.error;
  const { student } = auth;

  const body = await req.json();
  const quizId = body.quizId;
  if (!quizId) return NextResponse.json({ error: "quizId is required." }, { status: 400 });

  const db = supabaseAdmin();

  const { data: quiz, error: quizError } = await db.from("quizzes").select("*").eq("id", quizId).single();
  if (quizError || !quiz) return NextResponse.json({ error: "Quiz not found." }, { status: 404 });
  if (quiz.status !== "published") {
    return NextResponse.json({ error: "This quiz is not currently available." }, { status: 403 });
  }

  // Resume an in-progress attempt if one exists (refresh must not reset the timer).
  const { data: existing } = await db
    .from("attempts")
    .select("*")
    .eq("quiz_id", quizId)
    .eq("student_id", student.id)
    .eq("status", "in_progress")
    .maybeSingle();

  let attempt = existing;

  if (attempt && new Date(attempt.ends_at) <= new Date()) {
    // Time already ran out since last visit — auto-submit it now.
    await finalizeAttempt(db, attempt.id);
    attempt = null;
  }

  if (!attempt) {
    const { count: submittedCount } = await db
      .from("attempts")
      .select("*", { count: "exact", head: true })
      .eq("quiz_id", quizId)
      .eq("student_id", student.id)
      .eq("status", "submitted");

    if (quiz.attempt_limit !== null && (submittedCount || 0) >= quiz.attempt_limit) {
      return NextResponse.json({ error: "You have used all of your attempts for this quiz." }, { status: 403 });
    }

    const { data: questions } = await db.from("questions").select("id").eq("quiz_id", quizId);
    if (!questions || questions.length === 0) {
      return NextResponse.json({ error: "This quiz has no questions yet." }, { status: 400 });
    }

    const endsAt = new Date(Date.now() + quiz.duration_minutes * 60 * 1000).toISOString();

    const { data: newAttempt, error: attemptError } = await db
      .from("attempts")
      .insert({
        quiz_id: quizId,
        student_id: student.id,
        attempt_number: (submittedCount || 0) + 1,
        status: "in_progress",
        ends_at: endsAt,
        total_questions: questions.length,
      })
      .select()
      .single();

    if (attemptError || !newAttempt) {
      return NextResponse.json({ error: "Could not start the quiz. Please try again." }, { status: 500 });
    }
    attempt = newAttempt;
  }

  const { data: questions } = await db
    .from("questions")
    .select("id, question_text, option_a, option_b, option_c, option_d, image_url, subject_id, order_index")
    .eq("quiz_id", quizId)
    .order("order_index");

  const orderedQuestions = quiz.shuffle_questions ? shuffle(questions || []) : questions || [];

  const { data: savedAnswers } = await db
    .from("attempt_answers")
    .select("question_id, selected_answer")
    .eq("attempt_id", attempt.id);

  const answersMap: Record<string, string> = {};
  for (const a of savedAnswers || []) {
    if (a.selected_answer) answersMap[a.question_id] = a.selected_answer;
  }

  return NextResponse.json({
    attempt: {
      id: attempt.id,
      endsAt: attempt.ends_at,
      startedAt: attempt.started_at,
    },
    questions: orderedQuestions,
    savedAnswers: answersMap,
  });
}

