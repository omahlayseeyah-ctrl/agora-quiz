import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";
import { slugify } from "@/lib/slug";

// Admin: list all quizzes with subject names + question counts.
export async function GET() {
  const result = await requireAdmin();
  if ("error" in result) return result.error;

  const db = supabaseAdmin();
  const { data: quizzes, error } = await db
    .from("quizzes")
    .select("*, quiz_subjects(subject_id, subjects(id, name)), questions(count)")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: "Could not load quizzes." }, { status: 500 });

  const shaped = (quizzes || []).map((q: any) => ({
    ...q,
    subjects: (q.quiz_subjects || []).map((qs: any) => qs.subjects),
    question_count: q.questions?.[0]?.count ?? 0,
  }));

  return NextResponse.json({ quizzes: shaped });
}

// Admin: create a new quiz (draft by default).
export async function POST(req: NextRequest) {
  const result = await requireAdmin();
  if ("error" in result) return result.error;

  const body = await req.json();
  const title = (body.title || "").trim();
  if (!title) return NextResponse.json({ error: "Quiz title is required." }, { status: 400 });

  const subjectIds: string[] = Array.isArray(body.subjectIds) ? body.subjectIds : [];
  const durationMinutes = Number(body.durationMinutes) || 30;
  const attemptLimitRaw = body.attemptLimit;
  const attemptLimit = attemptLimitRaw === "unlimited" || attemptLimitRaw === null ? null : Number(attemptLimitRaw) || 1;

  const db = supabaseAdmin();
  const slug = slugify(title);

  const { data: quiz, error } = await db
    .from("quizzes")
    .insert({
      title,
      slug,
      description: body.description || null,
      duration_minutes: durationMinutes,
      attempt_limit: attemptLimit,
      results_visibility: body.resultsVisibility === "public" ? "public" : "private",
      explanations_visibility: body.explanationsVisibility === "public" ? "public" : "private",
      leaderboard_visibility: body.leaderboardVisibility === "public" ? "public" : "private",
      shuffle_questions: !!body.shuffleQuestions,
      is_premium: !!body.isPremium,
      status: "draft",
    })
    .select()
    .single();

  if (error || !quiz) return NextResponse.json({ error: "Could not create quiz." }, { status: 500 });

  if (subjectIds.length > 0) {
    const rows = subjectIds.map((sid) => ({ quiz_id: quiz.id, subject_id: sid }));
    await db.from("quiz_subjects").insert(rows);
  }

  return NextResponse.json({ quiz });
}
