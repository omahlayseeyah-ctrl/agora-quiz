import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { requireStudent } from "@/lib/auth";
import { getAdminSession } from "@/lib/session";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const db = supabaseAdmin();

  const { data: quiz } = await db
    .from("quizzes")
    .select("id, title, leaderboard_visibility, duration_minutes, quiz_subjects(subjects(name))")
    .eq("id", params.id)
    .single();
  if (!quiz) return NextResponse.json({ error: "Quiz not found." }, { status: 404 });

  // Admins can always view. Students may view only if the admin made the
  // leaderboard public for this quiz, and only once they're logged in.
  const adminSession = await getAdminSession();
  if (!adminSession) {
    const auth = await requireStudent();
    if ("error" in auth) return auth.error;
    if (quiz.leaderboard_visibility !== "public") {
      return NextResponse.json({ error: "The leaderboard for this quiz is currently private." }, { status: 403 });
    }
  }

  const { data: rows, error } = await db
    .from("quiz_leaderboard")
    .select("*")
    .eq("quiz_id", params.id)
    .order("rank")
    .limit(100);

  if (error) return NextResponse.json({ error: "Could not load leaderboard." }, { status: 500 });

  const subjectNames = (quiz.quiz_subjects || []).map((s: any) => s.subjects?.name).filter(Boolean).join(", ");

  return NextResponse.json({
    quizTitle: quiz.title,
    subjectNames,
    durationMinutes: quiz.duration_minutes,
    candidateCount: rows?.length || 0,
    leaderboard: (rows || []).map((r: any) => ({
      rank: r.rank,
      studentName: `${r.first_name} ${r.last_name}`,
      score: r.score,
      totalQuestions: r.total_questions,
      percentage: r.percentage,
      startedAt: r.started_at,
      submittedAt: r.submitted_at,
    })),
  });
}
