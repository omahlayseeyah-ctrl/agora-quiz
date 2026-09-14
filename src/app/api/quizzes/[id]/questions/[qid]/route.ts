import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";

export async function PATCH(req: NextRequest, { params }: { params: { id: string; qid: string } }) {
  const result = await requireAdmin();
  if ("error" in result) return result.error;

  const body = await req.json();
  const db = supabaseAdmin();

  const updates: Record<string, unknown> = {};
  const map: Record<string, string> = {
    questionText: "question_text",
    optionA: "option_a",
    optionB: "option_b",
    optionC: "option_c",
    optionD: "option_d",
    correctAnswer: "correct_answer",
    explanation: "explanation",
    imageUrl: "image_url",
    subjectId: "subject_id",
    orderIndex: "order_index",
  };
  for (const [key, column] of Object.entries(map)) {
    if (body[key] !== undefined) updates[column] = body[key];
  }

  const { error } = await db.from("questions").update(updates).eq("id", params.qid).eq("quiz_id", params.id);
  if (error) return NextResponse.json({ error: "Could not update question." }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string; qid: string } }) {
  const result = await requireAdmin();
  if ("error" in result) return result.error;

  const db = supabaseAdmin();
  const { error } = await db.from("questions").delete().eq("id", params.qid).eq("quiz_id", params.id);
  if (error) return NextResponse.json({ error: "Could not delete question." }, { status: 500 });
  return NextResponse.json({ ok: true });
}
