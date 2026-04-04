import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export async function writeAdminAuditLog(input: {
  actorUserId?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  metadata?: Prisma.InputJsonValue;
}) {
  await prisma.adminAuditLog.create({
    data: {
      actorUserId: input.actorUserId ?? null,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId ?? null,
      metadata: input.metadata ?? ({} as Prisma.InputJsonValue)
    }
  });
}
