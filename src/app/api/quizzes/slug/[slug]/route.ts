import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { requireStudent } from "@/lib/auth";

// IMPORTANT: this is the endpoint the shared quiz link resolves to.
// Any authenticated STUDENT (not just the admin) must be able to load a
// published quiz here. It never returns correct answers or explanations.
export async function GET(req: NextRequest, { params }: { params: { slug: string } }) {
  const auth = await requireStudent();
  if ("error" in auth) return auth.error;

  const db = supabaseAdmin();
  const { data: quiz, error } = await db
    .from("quizzes")
    .select("id, title, slug, description, duration_minutes, attempt_limit, status, is_premium, quiz_subjects(subjects(id, name))")
    .eq("slug", params.slug)
    .single();

  if (error || !quiz) {
    return NextResponse.json({ error: "This quiz link is invalid or the quiz no longer exists." }, { status: 404 });
  }

  if (quiz.status !== "published") {
    return NextResponse.json({ error: "This quiz is not currently available." }, { status: 403 });
  }

  const { count: questionCount } = await db
    .from("questions")
    .select("*", { count: "exact", head: true })
    .eq("quiz_id", quiz.id);

  const { count: attemptsUsed } = await db
    .from("attempts")
    .select("*", { count: "exact", head: true })
    .eq("quiz_id", quiz.id)
    .eq("student_id", auth.student.id)
    .eq("status", "submitted");

  const { data: inProgress } = await db
    .from("attempts")
    .select("id, ends_at")
    .eq("quiz_id", quiz.id)
    .eq("student_id", auth.student.id)
    .eq("status", "in_progress")
    .maybeSingle();

  const attemptsRemaining = quiz.attempt_limit === null ? null : Math.max(quiz.attempt_limit - (attemptsUsed || 0), 0);

  return NextResponse.json({
    quiz: {
      id: quiz.id,
      title: quiz.title,
      slug: quiz.slug,
      description: quiz.description,
      durationMinutes: quiz.duration_minutes,
      attemptLimit: quiz.attempt_limit,
      isPremium: quiz.is_premium,
      subjects: (quiz.quiz_subjects || []).map((s: any) => s.subjects),
      questionCount: questionCount || 0,
    },
    attemptsUsed: attemptsUsed || 0,
    attemptsRemaining,
    canStart: attemptsRemaining === null || attemptsRemaining > 0 || !!inProgress,
    inProgressAttemptId: inProgress?.id || null,
  });
}
