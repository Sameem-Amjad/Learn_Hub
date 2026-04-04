import { NextResponse } from "next/server";
import { z } from "zod";

import { createServiceRoleClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/utils/admin-auth";

const schema = z.object({ userId: z.string().uuid() });

export async function POST(req: Request) {
  const { errorResponse } = await requireAdmin();
  if (errorResponse) {
    return errorResponse;
  }

  const body = schema.parse(await req.json());
  const supabase = createServiceRoleClient();

  const { error } = await supabase
    .from("subscriptions")
    .update({
      status: "canceled",
      cancel_at_period_end: true,
      current_period_end: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq("user_id", body.userId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
