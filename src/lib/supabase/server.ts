import { createClient } from "@supabase/supabase-js";

// Server-only client. Uses the service role key so it can read/write
// freely, bypassing Row Level Security. This file must never be imported
// from a "use client" component.
// Explicitly typed <any> so every query (e.g. .select("*").single()) is
// typed as `any` instead of `never`. Without this, some versions of
// @supabase/supabase-js infer `never` for row types when no Database
// generic is supplied, which breaks the production TypeScript build even
// though the code is logically correct.
let cached: ReturnType<typeof createClient<any, "public", any>> | null = null;

export function supabaseAdmin() {
  if (cached) return cached;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables."
    );
  }

  cached = createClient<any, "public", any>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return cached;
}
