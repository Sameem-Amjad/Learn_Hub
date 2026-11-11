import { NextResponse } from "next/server";

import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  const supabase = await createServerSupabaseClient();
  await supabase.auth.signOut();

  const origin = new URL(req.url).origin;
  // 303 so the browser follows with a GET, not a second POST.
  return NextResponse.redirect(`${origin}/login`, 303);
}
