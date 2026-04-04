import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/utils/admin-auth";

export async function GET() {
  const { errorResponse } = await requireAdmin();
  if (errorResponse) {
    return errorResponse;
  }

  const [usersCount, subscriptions, coursesCount, lessonsCount, progressRows] = await Promise.all([
    prisma.user.count(),
    prisma.subscription.findMany({ select: { tier: true, status: true } }),
    prisma.course.count({ where: { isPublished: true } }),
    prisma.lesson.count(),
    prisma.userProgress.findMany({ select: { completed: true } })
  ]);

  const activeSubs = (subscriptions ?? []).filter((sub) => sub.status === "active" || sub.status === "trialing");

  const byTier = {
    insider: activeSubs.filter((sub) => sub.tier === "insider").length,
    core: activeSubs.filter((sub) => sub.tier === "core").length,
    pro: activeSubs.filter((sub) => sub.tier === "pro").length
  };

  const totalProgress = (progressRows ?? []).length;
  const completedProgress = (progressRows ?? []).filter((row) => row.completed).length;

  return NextResponse.json({
    users: usersCount ?? 0,
    activeSubscriptions: activeSubs.length,
    byTier,
    publishedCourses: coursesCount ?? 0,
    lessons: lessonsCount ?? 0,
    completionRate: totalProgress > 0 ? Math.round((completedProgress / totalProgress) * 100) : 0
  });
}
