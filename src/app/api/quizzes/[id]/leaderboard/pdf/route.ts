import { NextRequest, NextResponse } from "next/server";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { supabaseAdmin } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";

function formatDuration(startedAt: string | null, submittedAt: string | null) {
  if (!startedAt || !submittedAt) return "—";
  const ms = new Date(submittedAt).getTime() - new Date(startedAt).getTime();
  if (ms <= 0) return "—";
  const totalSeconds = Math.round(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}m ${seconds}s`;
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const result = await requireAdmin();
  if ("error" in result) return result.error;

  const db = supabaseAdmin();
  const { data: quiz } = await db
    .from("quizzes")
    .select("title, duration_minutes, quiz_subjects(subjects(name))")
    .eq("id", params.id)
    .single();
  if (!quiz) return NextResponse.json({ error: "Quiz not found." }, { status: 404 });

  const { data: rows } = await db
    .from("quiz_leaderboard")
    .select("*")
    .eq("quiz_id", params.id)
    .order("rank")
    .limit(200);

  const subjectNames = (quiz.quiz_subjects || []).map((s: any) => s.subjects?.name).filter(Boolean).join(", ");

  const pdfDoc = await PDFDocument.create();
  let page = pdfDoc.addPage([595, 842]); // A4
  const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const regular = await pdfDoc.embedFont(StandardFonts.Helvetica);

  // AGORA QUIZ palette
  const blue = rgb(0.18, 0.56, 0.88);
  const darkBlue = rgb(0.09, 0.29, 0.47);
  const black = rgb(0.07, 0.08, 0.09);
  const white = rgb(1, 1, 1);
  const gray = rgb(0.5, 0.54, 0.58);
  const lightBlueBg = rgb(0.93, 0.97, 1);
  const green = rgb(0.12, 0.65, 0.45);
  const amber = rgb(0.96, 0.72, 0.15);
  const amberBg = rgb(1, 0.98, 0.9);

  const pageWidth = 595;
  const margin = 40;
  let y = 780;

  // Header banner
  page.drawRectangle({ x: 0, y: 760, width: pageWidth, height: 82, color: darkBlue });
  page.drawText("AGORA QUIZ", { x: margin, y: 805, size: 24, font: bold, color: white });
  page.drawText("Official Results", { x: margin, y: 785, size: 11, font: regular, color: rgb(0.8, 0.9, 1) });
  page.drawText(new Date().toLocaleDateString(), { x: pageWidth - 160, y: 805, size: 9, font: regular, color: rgb(0.8, 0.9, 1) });

  y = 735;
  page.drawText(quiz.title, { x: margin, y, size: 16, font: bold, color: black });
  y -= 16;
  const metaLine = [subjectNames, `${quiz.duration_minutes} minutes`, `${rows?.length || 0} candidates`].filter(Boolean).join("  ·  ");
  page.drawText(metaLine, { x: margin, y, size: 9, font: regular, color: gray });
  y -= 26;

  const tableWidth = pageWidth - margin * 2;

  // #1 Hero card
  const first = rows?.[0];
  if (first) {
    const heroHeight = 78;
    page.drawRectangle({ x: margin, y: y - heroHeight, width: tableWidth, height: heroHeight, color: amberBg, borderColor: amber, borderWidth: 1.5 });
    page.drawText("#1  ·  TOP CANDIDATE", { x: margin + 16, y: y - 20, size: 9, font: bold, color: amber });
    page.drawText(`${first.first_name} ${first.last_name}`, { x: margin + 16, y: y - 40, size: 16, font: bold, color: black });
    page.drawText(`Finished in ${formatDuration(first.started_at, first.submitted_at)}`, { x: margin + 16, y: y - 58, size: 9, font: regular, color: gray });

    const scoreText = `${Math.round(first.percentage)} / 100`;
    const scoreWidth = bold.widthOfTextAtSize(scoreText, 22);
    page.drawText(scoreText, { x: margin + tableWidth - scoreWidth - 16, y: y - 40, size: 22, font: bold, color: green });
    const correctText = `${first.score}/${first.total_questions} correct`;
    const correctWidth = regular.widthOfTextAtSize(correctText, 9);
    page.drawText(correctText, { x: margin + tableWidth - correctWidth - 16, y: y - 58, size: 9, font: regular, color: gray });

    y -= heroHeight + 20;
  }

  // Table header for the rest
  const colRank = margin;
  const colName = margin + 55;
  const colFinished = margin + 300;
  const colScore = margin + tableWidth - 110;

  page.drawRectangle({ x: margin, y: y - 6, width: tableWidth, height: 24, color: blue });
  page.drawText("RANK", { x: colRank + 5, y: y + 1, size: 9, font: bold, color: white });
  page.drawText("STUDENT", { x: colName, y: y + 1, size: 9, font: bold, color: white });
  page.drawText("TIME TAKEN", { x: colFinished, y: y + 1, size: 9, font: bold, color: white });
  page.drawText("SCORE", { x: colScore, y: y + 1, size: 9, font: bold, color: white });
  y -= 26;

  const rest = (rows || []).slice(1);
  const rowHeight = 30;

  rest.forEach((r: any, i: number) => {
    if (y < 60) {
      page = pdfDoc.addPage([595, 842]);
      y = 790;
    }

    const bg = i % 2 === 0 ? lightBlueBg : white;
    page.drawRectangle({ x: margin, y: y - 8, width: tableWidth, height: rowHeight, color: bg });

    const rankLabel = r.rank === 2 ? "2nd" : r.rank === 3 ? "3rd" : `${r.rank}`;
    page.drawText(rankLabel, { x: colRank + 5, y: y, size: 10, font: bold, color: r.rank <= 3 ? blue : gray });
    page.drawText(`${r.first_name} ${r.last_name}`, { x: colName, y: y, size: 10, font: regular, color: black });
    page.drawText(formatDuration(r.started_at, r.submitted_at), { x: colFinished, y: y, size: 9, font: regular, color: gray });
    page.drawText(`${Math.round(r.percentage)}/100`, { x: colScore, y: y, size: 10, font: bold, color: blue });
    page.drawText(`${r.score}/${r.total_questions} correct`, { x: colScore, y: y - 12, size: 8, font: regular, color: gray });

    y -= rowHeight + 2;
  });

  if (!rows || rows.length === 0) {
    page.drawText("No submissions yet.", { x: margin, y, size: 11, font: regular, color: gray });
  }

  const bytes = await pdfDoc.save();
  return new NextResponse(Buffer.from(bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="agora-quiz-leaderboard.pdf"`,
    },
  });
}
