import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { writeAdminAuditLog } from "@/lib/server/admin-audit";
import { requireAdmin } from "@/lib/utils/admin-auth";
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

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const body = parsed.data;
  const ids = sanitizeUuidArray(body.ids, 200);

  if (body.action === "publish_courses" || body.action === "unpublish_courses") {
    const existing = await prisma.course.findMany({ where: { id: { in: ids } }, select: { id: true } });
    if (existing.length !== ids.length) {
      return NextResponse.json({ error: "One or more course IDs do not exist" }, { status: 400 });
    }

    const result = await prisma.course.updateMany({
      where: { id: { in: ids } },
      data: { isPublished: body.action === "publish_courses", updatedAt: new Date() }
    });

    await writeAdminAuditLog({
      actorUserId: user?.id,
      action: body.action,
      entityType: "course",
      metadata: { ids }
    });

    return NextResponse.json({ ok: true, affected: result.count });
  }

  if (body.action === "grant_tier") {
    const existing = await prisma.user.findMany({ where: { id: { in: ids } }, select: { id: true } });
    if (existing.length !== ids.length) {
      return NextResponse.json({ error: "One or more user IDs do not exist" }, { status: 400 });
    }

    const now = new Date();
    const end = new Date(now);
    end.setDate(end.getDate() + 30);

    for (const userId of ids) {
      await prisma.subscription.upsert({
        where: { userId },
        create: {
          userId,
          stripeSubscriptionId: `manual_bulk_${userId}_${Date.now()}`,
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
    }

    await writeAdminAuditLog({
      actorUserId: user?.id,
      action: "grant_tier_bulk",
      entityType: "user",
      metadata: { ids, tier: body.tier }
    });

    return NextResponse.json({ ok: true, affected: ids.length });
  }

  const existing = await prisma.user.findMany({ where: { id: { in: ids } }, select: { id: true } });
  if (existing.length !== ids.length) {
    return NextResponse.json({ error: "One or more user IDs do not exist" }, { status: 400 });
  }

  const result = await prisma.subscription.updateMany({
    where: { userId: { in: ids } },
    data: {
      status: "canceled",
      cancelAtPeriodEnd: true,
      currentPeriodEnd: new Date(),
      updatedAt: new Date()
    }
  });

  await writeAdminAuditLog({
    actorUserId: user?.id,
    action: "revoke_access_bulk",
    entityType: "user",
    metadata: { ids }
  });

  return NextResponse.json({ ok: true, affected: result.count });
}
