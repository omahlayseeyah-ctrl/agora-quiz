import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { requireStudent } from "@/lib/auth";

export async function GET(req: NextRequest, { params }: { params: { attemptId: string } }) {
  const auth = await requireStudent();
  if ("error" in auth) return auth.error;

  const db = supabaseAdmin();
  const { data: attempt } = await db.from("attempts").select("*").eq("id", params.attemptId).single();

  if (!attempt || attempt.student_id !== auth.student.id) {
    return NextResponse.json({ error: "Attempt not found." }, { status: 404 });
  }
  if (attempt.status !== "submitted") {
    return NextResponse.json({ error: "This attempt has not been submitted yet." }, { status: 400 });
  }

  const { data: quiz } = await db
    .from("quizzes")
    .select("title, results_visibility, explanations_visibility")
    .eq("id", attempt.quiz_id)
    .single();

  if (!quiz) return NextResponse.json({ error: "Quiz not found." }, { status: 404 });

  if (quiz.results_visibility !== "public") {
    return NextResponse.json({
      resultsHidden: true,
      message: "Results for this quiz have not been released by the administrator yet.",
    });
  }

  const { data: questions } = await db
    .from("questions")
    .select("id, question_text, option_a, option_b, option_c, option_d, correct_answer, explanation, image_url, order_index")
    .eq("quiz_id", attempt.quiz_id)
    .order("order_index");

  const { data: answers } = await db
    .from("attempt_answers")
    .select("question_id, selected_answer, is_correct")
    .eq("attempt_id", attempt.id);

  const answerMap = new Map((answers || []).map((a) => [a.question_id, a]));
  const explanationsPublic = quiz.explanations_visibility === "public";

  const review = (questions || []).map((q) => {
    const ans = answerMap.get(q.id);
    return {
      id: q.id,
      questionText: q.question_text,
      optionA: q.option_a,
      optionB: q.option_b,
      optionC: q.option_c,
      optionD: q.option_d,
      correctAnswer: q.correct_answer,
      imageUrl: q.image_url,
      selectedAnswer: ans?.selected_answer || null,
      isCorrect: ans?.is_correct ?? false,
      explanation: explanationsPublic ? q.explanation : null,
    };
  });

  return NextResponse.json({
    resultsHidden: false,
    quizTitle: quiz.title,
    explanationsVisible: explanationsPublic,
    attempt: {
      score: attempt.score,
      totalQuestions: attempt.total_questions,
      correctCount: attempt.correct_count,
      incorrectCount: attempt.incorrect_count,
      percentage: attempt.percentage,
    },
    review,
  });
}
