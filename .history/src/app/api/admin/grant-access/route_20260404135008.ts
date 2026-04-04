import { NextResponse } from "next/server";
import { z } from "zod";

import { writeAdminAuditLog } from "@/lib/server/admin-audit";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/utils/admin-auth";

const schema = z.object({
  userId: z.string().uuid(),
  tier: z.enum(["insider", "core", "pro"]),
  durationDays: z.number().int().positive().max(3650).optional()
});

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

  const targetUser = await prisma.user.findUnique({ where: { id: body.userId }, select: { id: true } });
  if (!targetUser) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const now = new Date();
  const end = new Date(now);
  end.setDate(end.getDate() + (body.durationDays ?? 30));

  await prisma.subscription.upsert({
    where: { userId: body.userId },
    create: {
      userId: body.userId,
      stripeSubscriptionId: `manual_${body.userId}_${Date.now()}`,
      stripePriceId: `manual_${body.tier}`,
      tier: body.tier,
      status: "active",
      currentPeriodStart: now,
      currentPeriodEnd: end,
      cancelAtPeriodEnd: false,
      updatedAt: now
    },
    update: {
      stripePriceId: `manual_${body.tier}`,
      tier: body.tier,
      status: "active",
      currentPeriodStart: now,
      currentPeriodEnd: end,
      cancelAtPeriodEnd: false,
      updatedAt: now
    }
  });

  await writeAdminAuditLog({
    actorUserId: user?.id,
    action: "grant_access",
    entityType: "user",
    entityId: body.userId,
    metadata: { tier: body.tier, durationDays: body.durationDays ?? 30 }
  });

  return NextResponse.json({ ok: true });
}
