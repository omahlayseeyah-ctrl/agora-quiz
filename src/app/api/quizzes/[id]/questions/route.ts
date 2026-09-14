import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const result = await requireAdmin();
  if ("error" in result) return result.error;

  const db = supabaseAdmin();
  const { data, error } = await db
    .from("questions")
    .select("*")
    .eq("quiz_id", params.id)
    .order("order_index");

  if (error) return NextResponse.json({ error: "Could not load questions." }, { status: 500 });
  return NextResponse.json({ questions: data });
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const result = await requireAdmin();
  if ("error" in result) return result.error;

  const body = await req.json();
  const required = ["questionText", "optionA", "optionB", "optionC", "optionD", "correctAnswer"];
  for (const field of required) {
    if (!body[field] || String(body[field]).trim() === "") {
      return NextResponse.json({ error: `Missing required field: ${field}` }, { status: 400 });
    }
  }
  if (!["A", "B", "C", "D"].includes(body.correctAnswer)) {
    return NextResponse.json({ error: "correctAnswer must be A, B, C, or D." }, { status: 400 });
  }

  const db = supabaseAdmin();
  const { count } = await db
    .from("questions")
    .select("*", { count: "exact", head: true })
    .eq("quiz_id", params.id);

  const { data: question, error } = await db
    .from("questions")
    .insert({
      quiz_id: params.id,
      subject_id: body.subjectId || null,
      question_text: body.questionText,
      option_a: body.optionA,
      option_b: body.optionB,
      option_c: body.optionC,
      option_d: body.optionD,
      correct_answer: body.correctAnswer,
      explanation: body.explanation || null,
      image_url: body.imageUrl || null,
      order_index: count || 0,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: "Could not create question." }, { status: 500 });
  return NextResponse.json({ question });
}
