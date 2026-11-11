import { NextResponse } from "next/server";
import { z } from "zod";

import { writeAdminAuditLog } from "@/lib/server/admin-audit";
import { revokePlans } from "@/lib/server/subscriptions";
import { guardDemoAdminTargets, requireAdmin } from "@/lib/utils/admin-auth";

const schema = z.object({ userId: z.string().uuid() });

export async function POST(req: Request) {
  const { errorResponse, user } = await requireAdmin();
  if (errorResponse) {
    return errorResponse;
  }

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const blocked = await guardDemoAdminTargets(user, [parsed.data.userId]);
  if (blocked) return blocked;

  const affected = await revokePlans([parsed.data.userId]);
  if (affected === 0) {
    return NextResponse.json({ error: "This user has no plan to revoke" }, { status: 400 });
  }

  await writeAdminAuditLog({
    actorUserId: user.id,
    action: "revoke_access",
    entityType: "user",
    entityId: parsed.data.userId
  });

  return NextResponse.json({ ok: true });
}
