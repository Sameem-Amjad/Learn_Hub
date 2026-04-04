import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/utils/admin-auth";

const querySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().max(120).optional(),
  tier: z.enum(["insider", "core", "pro"]).optional(),
  status: z.enum(["active", "canceled", "past_due", "incomplete", "trialing"]).optional(),
  role: z.enum(["admin", "member"]).optional()
});

export async function GET(req: Request) {
  const { errorResponse } = await requireAdmin();
  if (errorResponse) {
    return errorResponse;
  }

  const params = new URL(req.url).searchParams;
  const parsed = querySchema.safeParse({
    page: params.get("page") ?? "1",
    pageSize: params.get("pageSize") ?? "20",
    search: params.get("search") ?? undefined,
    tier: params.get("tier") ?? undefined,
    status: params.get("status") ?? undefined,
    role: params.get("role") ?? undefined
  });

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { page, pageSize, search, tier, status, role } = parsed.data;
  const skip = (page - 1) * pageSize;

  const where = {
    AND: [
      search
        ? {
            OR: [
              { email: { contains: search, mode: "insensitive" as const } },
              { fullName: { contains: search, mode: "insensitive" as const } }
            ]
          }
        : {},
      tier || status
        ? {
            subscription: {
              is: {
                ...(tier ? { tier } : {}),
                ...(status ? { status } : {})
              }
            }
          }
        : {},
      role === "admin"
        ? {
            roles: {
              some: {
                role: { name: "admin" }
              }
            }
          }
        : {},
      role === "member"
        ? {
            roles: {
              none: {
                role: { name: "admin" }
              }
            }
          }
        : {}
    ]
  };

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
        subscription: {
          select: {
            tier: true,
            status: true,
            currentPeriodEnd: true
          }
        },
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
      is_admin: user.roles.length > 0,
      subscription: user.subscription
        ? {
            tier: user.subscription.tier,
            status: user.subscription.status,
            current_period_end: user.subscription.currentPeriodEnd
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
