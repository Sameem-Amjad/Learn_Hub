import { NextResponse } from "next/server";
import { z } from "zod";

import { isNoDeleteUser } from "@/lib/demo";
import { writeAdminAuditLog } from "@/lib/server/admin-audit";
import { activatePlan, existingUserIds, revokePlans } from "@/lib/server/subscriptions";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { guardDemoAdminTargets, requireAdmin } from "@/lib/utils/admin-auth";
import { sanitizeUuidArray } from "@/lib/utils/admin-validation";

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
  const { errorResponse, user } = await requireAdmin();
  if (errorResponse) {
    return errorResponse;
  }

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const body = parsed.data;
  const ids = sanitizeUuidArray(body.ids, 200);
  const supabase = createServiceRoleClient();

  if (body.action === "publish_courses" || body.action === "unpublish_courses") {
    if (body.action === "unpublish_courses" && isNoDeleteUser(user)) {
      return NextResponse.json({ error: "The demo admin can publish drafts but can't take courses down." }, { status: 403 });
    }

    const { data: existing } = await supabase.from("courses").select("id").in("id", ids);
    if ((existing ?? []).length !== ids.length) {
      return NextResponse.json({ error: "One or more course IDs do not exist" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("courses")
      .update({ is_published: body.action === "publish_courses", updated_at: new Date().toISOString() })
      .in("id", ids)
      .select("id");
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    await writeAdminAuditLog({ actorUserId: user.id, action: body.action, entityType: "course", metadata: { ids } });
    return NextResponse.json({ ok: true, affected: (data ?? []).length });
  }

  const found = await existingUserIds(ids);
  if (found.size !== ids.length) {
    return NextResponse.json({ error: "One or more user IDs do not exist" }, { status: 400 });
  }

  const blocked = await guardDemoAdminTargets(user, ids);
  if (blocked) return blocked;

  if (body.action === "grant_tier") {
    await activatePlan(ids, body.tier, { source: "admin" });
    await writeAdminAuditLog({ actorUserId: user.id, action: "grant_tier_bulk", entityType: "user", metadata: { ids, tier: body.tier } });
    return NextResponse.json({ ok: true, affected: ids.length });
  }

  const affected = await revokePlans(ids);
  await writeAdminAuditLog({ actorUserId: user.id, action: "revoke_access_bulk", entityType: "user", metadata: { ids } });
  return NextResponse.json({ ok: true, affected });
}
