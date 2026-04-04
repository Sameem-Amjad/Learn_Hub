import { cache } from "react";

import { prisma } from "@/lib/prisma";
import { hasAccess } from "@/lib/utils/tier-comparison";
import type { SubscriptionTier } from "@/types/subscription";

export const getUserTier = cache(async (userId: string): Promise<SubscriptionTier | null> => {
  const subscription = await prisma.subscription.findFirst({
    where: {
      userId,
      status: {
        in: ["active", "trialing"]
      }
    },
    select: { tier: true }
  });

  return (subscription?.tier as SubscriptionTier | undefined) ?? null;
});

export async function getCoursesForUser(userId: string) {
  const userTier = await getUserTier(userId);

  const rows = await prisma.course.findMany({
    where: { isPublished: true },
    select: {
      id: true,
      title: true,
      slug: true,
      description: true,
      thumbnailUrl: true,
      requiredTier: true,
      isPublished: true,
      orderIndex: true
    },
    orderBy: { orderIndex: "asc" }
  });

  return rows.map((course) => ({
    id: course.id,
    title: course.title,
    slug: course.slug,
    description: course.description,
    thumbnail_url: course.thumbnailUrl,
    required_tier: course.requiredTier,
    is_published: course.isPublished,
    order_index: course.orderIndex,
    has_access: userTier ? hasAccess(userTier, course.requiredTier as SubscriptionTier) : false
  }));
}

export async function getCourseWithModules(courseSlug: string) {
  const course = await prisma.course.findFirst({
    where: { slug: courseSlug, isPublished: true },
    select: {
      id: true,
      title: true,
      slug: true,
      description: true,
      requiredTier: true,
      modules: {
        select: {
          id: true,
          courseId: true,
          title: true,
          slug: true,
          orderIndex: true,
          lessons: {
            select: {
              id: true,
              moduleId: true,
              title: true,
              slug: true,
              content: true,
              videoUrl: true,
              isPreview: true,
              orderIndex: true
            },
            orderBy: { orderIndex: "asc" }
          }
        },
        orderBy: { orderIndex: "asc" }
      }
    }
  });

  if (!course) {
    return null;
  }

  return {
    id: course.id,
    title: course.title,
    slug: course.slug,
    description: course.description,
    required_tier: course.requiredTier,
    modules: course.modules.map((module) => ({
      id: module.id,
      course_id: module.courseId,
      title: module.title,
      slug: module.slug,
      order_index: module.orderIndex,
      lessons: module.lessons.map((lesson) => ({
        id: lesson.id,
        module_id: lesson.moduleId,
        title: lesson.title,
        slug: lesson.slug,
        content: lesson.content,
        video_url: lesson.videoUrl,
        is_preview: lesson.isPreview,
        order_index: lesson.orderIndex
      }))
    }))
  };
}

export async function getDashboardProgress(userId: string) {
  const [totalLessons, progressRows] = await Promise.all([
    prisma.lesson.count(),
    prisma.userProgress.findMany({
      where: { userId },
      select: {
        lessonId: true,
        completed: true,
        lastPosition: true,
        updatedAt: true
      },
      orderBy: { updatedAt: "desc" }
    })
  ]);

  const completedLessons = progressRows.filter((row) => row.completed).length;
  const total = totalLessons;
  const completionRate = total > 0 ? Math.round((completedLessons / total) * 100) : 0;

  const latest = progressRows[0] ?? null;

  return {
    totalLessons: total,
    completedLessons,
    completionRate,
    latestLessonId: latest?.lessonId ?? null,
    latestPosition: latest?.lastPosition ?? 0
  };
}
