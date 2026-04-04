import { NextResponse } from "next/server";
import { z } from "zod";

import { createServiceRoleClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/utils/admin-auth";

const schema = z.object({
  userId: z.string().uuid(),
  tier: z.enum(["insider", "core", "pro"]),
  durationDays: z.number().int().positive().max(3650).optional()
});

export async function POST(req: Request) {
  const { errorResponse } = await requireAdmin();
  if (errorResponse) {
    return errorResponse;
  }

  const body = schema.parse(await req.json());
  const supabase = createServiceRoleClient();

  const now = new Date();
  const end = new Date(now);
  end.setDate(end.getDate() + (body.durationDays ?? 30));

  const payload = {
    user_id: body.userId,
    stripe_subscription_id: `manual_${body.userId}_${Date.now()}`,
    stripe_price_id: `manual_${body.tier}`,
    tier: body.tier,
    status: "active",
    current_period_start: now.toISOString(),
    current_period_end: end.toISOString(),
    cancel_at_period_end: false,
    updated_at: now.toISOString()
  };

  const { error } = await supabase.from("subscriptions").upsert(payload, {
    onConflict: "user_id"
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
