import { NextResponse } from "next/server";

import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET(req: Request) {
  const { searchParams, origin } = new URL(req.url);
  const code = searchParams.get("code");
  const wanted = searchParams.get("next") ?? "/dashboard";
  // Same-site paths only, so the link can't send people elsewhere.
  const next = wanted.startsWith("/") && !wanted.startsWith("//") ? wanted : "/dashboard";

  if (code) {
    const supabase = await createServerSupabaseClient();
    await supabase.auth.exchangeCodeForSession(code);
  }

  return NextResponse.redirect(`${origin}${next}`);
}
