import { NextRequest, NextResponse } from "next/server";
import Papa from "papaparse";
import { supabaseAdmin } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";

const EXPECTED_HEADERS = [
  "Question",
  "Option A",
  "Option B",
  "Option C",
  "Option D",
  "Correct Answer",
  "Explanation",
];

// Expects a JSON body: { csvText: string, subjectId?: string, previewOnly?: boolean }
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const result = await requireAdmin();
  if ("error" in result) return result.error;

  const body = await req.json();
  const csvText: string = body.csvText || "";
  const previewOnly = !!body.previewOnly;
  const subjectId: string | null = body.subjectId || null;

  if (!csvText.trim()) {
    return NextResponse.json({ error: "No CSV content was provided." }, { status: 400 });
  }

  const parsed = Papa.parse<string[]>(csvText.trim(), {
    skipEmptyLines: true,
  });

  if (parsed.errors?.length) {
    return NextResponse.json(
      { error: `CSV parsing error: ${parsed.errors[0].message} (row ${parsed.errors[0].row})` },
      { status: 400 }
    );
  }

  const rows = parsed.data;
  if (rows.length === 0) {
    return NextResponse.json({ error: "The CSV file is empty." }, { status: 400 });
  }

  let dataRows = rows;
  const firstRow = rows[0].map((c) => (c || "").trim().toLowerCase());
  const looksLikeHeader = EXPECTED_HEADERS.some((h) => firstRow.includes(h.toLowerCase()));
  if (looksLikeHeader) dataRows = rows.slice(1);

  const validQuestions: any[] = [];
  const rowErrors: { row: number; message: string }[] = [];

  dataRows.forEach((row, idx) => {
    const rowNum = idx + (looksLikeHeader ? 2 : 1);
    const [question, a, b, c, d, correct, explanation] = row.map((cell) => (cell ?? "").trim());

    if (!question || !a || !b || !c || !d || !correct) {
      rowErrors.push({ row: rowNum, message: "Missing one or more required fields." });
      return;
    }
    const correctUpper = correct.toUpperCase();
    if (!["A", "B", "C", "D"].includes(correctUpper)) {
      rowErrors.push({ row: rowNum, message: `Correct Answer must be A, B, C or D (got "${correct}").` });
      return;
    }

    validQuestions.push({
      question_text: question,
      option_a: a,
      option_b: b,
      option_c: c,
      option_d: d,
      correct_answer: correctUpper,
      explanation: explanation || null,
      subject_id: subjectId,
    });
  });

  if (previewOnly) {
    return NextResponse.json({
      preview: validQuestions.slice(0, 50),
      totalValid: validQuestions.length,
      totalRows: dataRows.length,
      errors: rowErrors,
    });
  }

  if (validQuestions.length === 0) {
    return NextResponse.json({ error: "No valid questions were found in the CSV.", errors: rowErrors }, { status: 400 });
  }

  const db = supabaseAdmin();
  const { count } = await db
    .from("questions")
    .select("*", { count: "exact", head: true })
    .eq("quiz_id", params.id);

  const startIndex = count || 0;
  const rowsToInsert = validQuestions.map((q, i) => ({
    ...q,
    quiz_id: params.id,
    order_index: startIndex + i,
  }));

  const { error } = await db.from("questions").insert(rowsToInsert);
  if (error) {
    return NextResponse.json({ error: "Could not save imported questions." }, { status: 500 });
  }

  return NextResponse.json({
    imported: rowsToInsert.length,
    skipped: rowErrors.length,
    errors: rowErrors,
  });
}
