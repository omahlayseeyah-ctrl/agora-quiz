import { NextResponse } from "next/server";
import { requireStudent } from "@/lib/auth";

export async function GET() {
  const result = await requireStudent();
  if ("error" in result) return result.error;
  const { student } = result;
  return NextResponse.json({
    student: {
      id: student.id,
      firstName: student.first_name,
      lastName: student.last_name,
      username: student.username,
      email: student.email,
      hasSeenWhatsappInstructions: student.has_seen_whatsapp_instructions,
    },
  });
}
