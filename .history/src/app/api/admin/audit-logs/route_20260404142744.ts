import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/utils/admin-auth";

const querySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10),
  action: z.string().trim().max(80).optional(),
  entityType: z.string().trim().max(80).optional()
});

export async function GET(req: Request) {
  const { errorResponse } = await requireAdmin();
  if (errorResponse) {
    return errorResponse;
  }

  const params = new URL(req.url).searchParams;
  const parsed = querySchema.safeParse({
    page: params.get("page") ?? "1",
    pageSize: params.get("pageSize") ?? "10",
    action: params.get("action") ?? undefined,
    entityType: params.get("entityType") ?? undefined
  });

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { page, pageSize, action, entityType } = parsed.data;
  const skip = (page - 1) * pageSize;

  const where = {
    ...(action ? { action } : {}),
    ...(entityType ? { entityType } : {})
  };

  const [total, logs] = await Promise.all([
    prisma.adminAuditLog.count({ where }),
    prisma.adminAuditLog.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        action: true,
        entityType: true,
        entityId: true,
        createdAt: true,
        actor: {
          select: {
            id: true,
            email: true,
            fullName: true
          }
        }
      }
    })
  ]);

  return NextResponse.json({
    logs: logs.map((log) => ({
      id: log.id,
      action: log.action,
      entity_type: log.entityType,
      entity_id: log.entityId,
      created_at: log.createdAt,
      actor: log.actor
        ? {
            id: log.actor.id,
            email: log.actor.email,
            full_name: log.actor.fullName
          }
        : null
    })),
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize)
    }
  });
}
