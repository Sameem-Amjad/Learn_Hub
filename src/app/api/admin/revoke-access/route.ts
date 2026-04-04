import { NextResponse } from "next/server";
import { z } from "zod";

import { writeAdminAuditLog } from "@/lib/server/admin-audit";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/utils/admin-auth";

const schema = z.object({ userId: z.string().uuid() });

export async function POST(req: Request) {
  const { errorResponse, user } = await requireAdmin();
  if (errorResponse) {
    return errorResponse;
  }

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const body = parsed.data;

  await prisma.subscription.updateMany({
    where: { userId: body.userId },
    data: {
      status: "canceled",
      cancelAtPeriodEnd: true,
      currentPeriodEnd: new Date(),
      updatedAt: new Date()
    }
  });

  await writeAdminAuditLog({
    actorUserId: user?.id,
    action: "revoke_access",
    entityType: "user",
    entityId: body.userId
  });

  return NextResponse.json({ ok: true });
}
