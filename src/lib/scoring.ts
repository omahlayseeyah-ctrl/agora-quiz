import { supabaseAdmin } from "./supabase/server";

export async function finalizeAttempt(db: ReturnType<typeof supabaseAdmin>, attemptId: string) {
  const { data: attempt } = await db.from("attempts").select("*").eq("id", attemptId).single();
  if (!attempt || attempt.status !== "in_progress") return attempt;

  const { data: questions } = await db.from("questions").select("id, correct_answer").eq("quiz_id", attempt.quiz_id);
  const { data: answers } = await db
    .from("attempt_answers")
    .select("question_id, selected_answer")
    .eq("attempt_id", attemptId);

  const answerMap = new Map((answers || []).map((a) => [a.question_id, a.selected_answer]));
  let correct = 0;
  for (const q of questions || []) {
    const selected = answerMap.get(q.id);
    if (selected && selected === q.correct_answer) correct++;
  }
  const total = questions?.length || 0;
  const incorrect = total - correct;
  const percentage = total > 0 ? Number(((correct / total) * 100).toFixed(2)) : 0;

  const { data: updated } = await db
    .from("attempts")
    .update({
      status: "submitted",
      submitted_at: new Date().toISOString(),
      score: correct,
      total_questions: total,
      correct_count: correct,
      incorrect_count: incorrect,
      percentage,
    })
    .eq("id", attemptId)
    .select()
    .single();

  return updated;
}
