import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";

export async function GET() {
  const result = await requireAdmin();
  if ("error" in result) return result.error;
  const { admin } = result;
  return NextResponse.json({
    admin: { id: admin.id, username: admin.username, mustChangePassword: admin.must_change_password },
  });
}
