import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const result = await requireAdmin();
  if ("error" in result) return result.error;

  const db = supabaseAdmin();
  const { data: quiz, error } = await db
    .from("quizzes")
    .select("*, quiz_subjects(subject_id)")
    .eq("id", params.id)
    .single();

  if (error || !quiz) return NextResponse.json({ error: "Quiz not found." }, { status: 404 });

  return NextResponse.json({
    quiz: { ...quiz, subjectIds: (quiz.quiz_subjects || []).map((s: any) => s.subject_id) },
  });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const result = await requireAdmin();
  if ("error" in result) return result.error;

  const body = await req.json();
  const db = supabaseAdmin();

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (body.title !== undefined) updates.title = body.title;
  if (body.description !== undefined) updates.description = body.description;
  if (body.durationMinutes !== undefined) updates.duration_minutes = Number(body.durationMinutes);
  if (body.attemptLimit !== undefined) {
    updates.attempt_limit = body.attemptLimit === "unlimited" || body.attemptLimit === null ? null : Number(body.attemptLimit);
  }
  if (body.resultsVisibility !== undefined) updates.results_visibility = body.resultsVisibility;
  if (body.explanationsVisibility !== undefined) updates.explanations_visibility = body.explanationsVisibility;
  if (body.leaderboardVisibility !== undefined) updates.leaderboard_visibility = body.leaderboardVisibility;
  if (body.shuffleQuestions !== undefined) updates.shuffle_questions = !!body.shuffleQuestions;
  if (body.isPremium !== undefined) updates.is_premium = !!body.isPremium;

  const { error } = await db.from("quizzes").update(updates).eq("id", params.id);
  if (error) return NextResponse.json({ error: "Could not update quiz." }, { status: 500 });

  if (Array.isArray(body.subjectIds)) {
    await db.from("quiz_subjects").delete().eq("quiz_id", params.id);
    if (body.subjectIds.length > 0) {
      await db
        .from("quiz_subjects")
        .insert(body.subjectIds.map((sid: string) => ({ quiz_id: params.id, subject_id: sid })));
    }
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const result = await requireAdmin();
  if ("error" in result) return result.error;

  const db = supabaseAdmin();
  // Archive rather than hard-delete so historical attempts/results stay intact.
  const { error } = await db.from("quizzes").update({ status: "archived" }).eq("id", params.id);
  if (error) return NextResponse.json({ error: "Could not archive quiz." }, { status: 500 });

  return NextResponse.json({ ok: true });
}
