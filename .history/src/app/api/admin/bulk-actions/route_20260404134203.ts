import { NextResponse } from "next/server";
import { z } from "zod";

import { createServiceRoleClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/utils/admin-auth";

const schema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("publish_courses"), ids: z.array(z.string().uuid()).min(1) }),
  z.object({ action: z.literal("unpublish_courses"), ids: z.array(z.string().uuid()).min(1) }),
  z.object({
    action: z.literal("grant_tier"),
    ids: z.array(z.string().uuid()).min(1),
    tier: z.enum(["insider", "core", "pro"])
  }),
  z.object({ action: z.literal("revoke_access"), ids: z.array(z.string().uuid()).min(1) })
]);

export async function POST(req: Request) {
  const { errorResponse } = await requireAdmin();
  if (errorResponse) {
    return errorResponse;
  }

  const body = schema.parse(await req.json());
  const supabase = createServiceRoleClient();

  if (body.action === "publish_courses" || body.action === "unpublish_courses") {
    const { error } = await supabase
      .from("courses")
      .update({ is_published: body.action === "publish_courses", updated_at: new Date().toISOString() })
      .in("id", body.ids);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true, affected: body.ids.length });
  }

  if (body.action === "grant_tier") {
    const now = new Date();
    const end = new Date(now);
    end.setDate(end.getDate() + 30);

    const rows = body.ids.map((userId) => ({
      user_id: userId,
      stripe_subscription_id: `manual_bulk_${userId}_${Date.now()}`,
      stripe_price_id: `manual_${body.tier}`,
      tier: body.tier,
      status: "active",
      current_period_start: now.toISOString(),
      current_period_end: end.toISOString(),
      cancel_at_period_end: false,
      updated_at: now.toISOString()
    }));

    const { error } = await supabase.from("subscriptions").upsert(rows, { onConflict: "user_id" });
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true, affected: body.ids.length });
  }

  const { error } = await supabase
    .from("subscriptions")
    .update({
      status: "canceled",
      cancel_at_period_end: true,
      current_period_end: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .in("user_id", body.ids);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true, affected: body.ids.length });
}
