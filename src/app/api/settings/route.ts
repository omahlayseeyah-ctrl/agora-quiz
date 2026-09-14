import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";

// Publicly readable (students need the WhatsApp link + contact number),
// but only the admin can write these values.
export async function GET() {
  const db = supabaseAdmin();
  const { data, error } = await db.from("platform_settings").select("key, value");
  if (error) {
    return NextResponse.json({ error: "Could not load settings." }, { status: 500 });
  }
  const settings: Record<string, string> = {};
  for (const row of data || []) settings[row.key] = row.value;
  return NextResponse.json({ settings });
}

export async function POST(req: NextRequest) {
  const result = await requireAdmin();
  if ("error" in result) return result.error;

  const body = await req.json();
  const whatsappChannelLink = (body.whatsappChannelLink ?? "").trim();
  const contactPhoneNumber = (body.contactPhoneNumber ?? "").trim();

  const db = supabaseAdmin();
  const updates = [
    { key: "whatsapp_channel_link", value: whatsappChannelLink, updated_at: new Date().toISOString() },
    { key: "contact_phone_number", value: contactPhoneNumber, updated_at: new Date().toISOString() },
  ];

  const { error } = await db.from("platform_settings").upsert(updates, { onConflict: "key" });
  if (error) {
    return NextResponse.json({ error: "Could not save settings." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
