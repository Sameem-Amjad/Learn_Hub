import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { writeAdminAuditLog } from "@/lib/server/admin-audit";
import { requireAdmin } from "@/lib/utils/admin-auth";

const getQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10),
  search: z.string().trim().max(120).optional()
});

const roleMutationSchema = z.object({
  userId: z.string().uuid(),
  role: z.literal("admin").default("admin")
});

export async function GET(req: Request) {
  const { errorResponse } = await requireAdmin();
  if (errorResponse) {
    return errorResponse;
  }

  const params = new URL(req.url).searchParams;
  const parsed = getQuerySchema.safeParse({
    page: params.get("page") ?? "1",
    pageSize: params.get("pageSize") ?? "10",
    search: params.get("search") ?? undefined
  });

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { page, pageSize, search } = parsed.data;
  const skip = (page - 1) * pageSize;

  const where = search
    ? {
        OR: [
          { email: { contains: search, mode: "insensitive" as const } },
          { fullName: { contains: search, mode: "insensitive" as const } }
        ]
      }
    : {};

  const [total, users] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        email: true,
        fullName: true,
        createdAt: true,
        roles: {
          where: { role: { name: "admin" } },
          select: { roleId: true },
          take: 1
        }
      }
    })
  ]);

  return NextResponse.json({
    users: users.map((user) => ({
      id: user.id,
      email: user.email,
      full_name: user.fullName,
      created_at: user.createdAt,
      is_admin: user.roles.length > 0
    })),
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize)
    }
  });
}

export async function POST(req: Request) {
  const { errorResponse, user } = await requireAdmin();
  if (errorResponse) {
    return errorResponse;
  }

  const parsed = roleMutationSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { userId } = parsed.data;
  const adminRole = await prisma.role.findUnique({ where: { name: "admin" }, select: { id: true } });

  if (!adminRole) {
    return NextResponse.json({ error: "Admin role not found" }, { status: 500 });
  }

  const targetUser = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } });
  if (!targetUser) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  await prisma.userRole.upsert({
    where: {
      userId_roleId: {
        userId,
        roleId: adminRole.id
      }
    },
    create: {
      userId,
      roleId: adminRole.id,
      createdBy: user?.id ?? null
    },
    update: {}
  });

  await writeAdminAuditLog({
    actorUserId: user?.id,
    action: "assign_admin_role",
    entityType: "user",
    entityId: userId
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  const { errorResponse, user } = await requireAdmin();
  if (errorResponse) {
    return errorResponse;
  }

  const parsed = roleMutationSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { userId } = parsed.data;
  const adminRole = await prisma.role.findUnique({ where: { name: "admin" }, select: { id: true } });

  if (!adminRole) {
    return NextResponse.json({ error: "Admin role not found" }, { status: 500 });
  }

  const adminCount = await prisma.userRole.count({ where: { roleId: adminRole.id } });
  const targetHasAdmin = await prisma.userRole.findUnique({
    where: {
      userId_roleId: {
        userId,
        roleId: adminRole.id
      }
    },
    select: { userId: true }
  });

  if (!targetHasAdmin) {
    return NextResponse.json({ error: "User is not an admin" }, { status: 400 });
  }

  if (adminCount <= 1) {
    return NextResponse.json({ error: "Cannot remove the last admin" }, { status: 400 });
  }

  await prisma.userRole.delete({
    where: {
      userId_roleId: {
        userId,
        roleId: adminRole.id
      }
    }
  });

  await writeAdminAuditLog({
    actorUserId: user?.id,
    action: "remove_admin_role",
    entityType: "user",
    entityId: userId
  });

  return NextResponse.json({ ok: true });
}
