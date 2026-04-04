import { cache } from "react";

import { createServiceRoleClient } from "@/lib/supabase/server";
import { hasAccess } from "@/lib/utils/tier-comparison";
import type { SubscriptionTier } from "@/types/subscription";

export const getUserTier = cache(async (userId: string): Promise<SubscriptionTier | null> => {
  const supabase = createServiceRoleClient();
  const { data } = await supabase
    .from("subscriptions")
    .select("tier,status")
    .eq("user_id", userId)
    .in("status", ["active", "trialing"])
    .maybeSingle();

  return (data?.tier as SubscriptionTier | undefined) ?? null;
});

export async function getCoursesForUser(userId: string) {
  const supabase = createServiceRoleClient();
  const userTier = await getUserTier(userId);

  const { data } = await supabase
    .from("courses")
    .select("id,title,slug,description,thumbnail_url,required_tier,is_published,order_index")
    .eq("is_published", true)
    .order("order_index", { ascending: true });

  const rows = (data ?? []) as Array<{
    id: string;
    title: string;
    slug: string;
    description: string | null;
    thumbnail_url: string | null;
    required_tier: SubscriptionTier;
    is_published: boolean;
    order_index: number;
  }>;

  return rows.map((course) => ({
    ...course,
    has_access: userTier ? hasAccess(userTier, course.required_tier) : false
  }));
}

export async function getCourseWithModules(courseSlug: string) {
  const supabase = createServiceRoleClient();
  const { data: course } = await supabase
    .from("courses")
    .select("id,title,slug,description,required_tier,is_published")
    .eq("slug", courseSlug)
    .eq("is_published", true)
    .maybeSingle();

  if (!course) {
    return null;
  }

  const { data: modules } = await supabase
    .from("modules")
    .select("id,course_id,title,slug,order_index")
    .eq("course_id", course.id)
    .order("order_index", { ascending: true });

  const moduleRows = (modules ?? []) as Array<{ id: string; course_id: string; title: string; slug: string; order_index: number }>;

  const { data: lessons } = await supabase
    .from("lessons")
    .select("id,module_id,title,slug,content,video_url,is_preview,order_index")
    .in(
      "module_id",
      moduleRows.map((m) => m.id)
    )
    .order("order_index", { ascending: true });

  const lessonRows = (lessons ?? []) as Array<{
    id: string;
    module_id: string;
    title: string;
    slug: string;
    content: string | null;
    video_url: string | null;
    is_preview: boolean;
    order_index: number;
  }>;

  return {
    ...(course as { id: string; title: string; slug: string; description: string | null; required_tier: SubscriptionTier }),
    modules: moduleRows.map((module) => ({
      ...module,
      lessons: lessonRows.filter((lesson) => lesson.module_id === module.id)
    }))
  };
}

export async function getDashboardProgress(userId: string) {
  const supabase = createServiceRoleClient();

  const [{ data: totalLessons }, { data: progressRows }] = await Promise.all([
    supabase.from("lessons").select("id", { count: "exact" }),
    supabase
      .from("user_progress")
      .select("lesson_id,completed,last_position,updated_at")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false })
  ]);

  const progress = (progressRows ?? []) as Array<{
    lesson_id: string;
    completed: boolean;
    last_position: number;
    updated_at: string;
  }>;

  const completedLessons = progress.filter((row) => row.completed).length;
  const total = totalLessons?.length ?? 0;
  const completionRate = total > 0 ? Math.round((completedLessons / total) * 100) : 0;

  const latest = progress[0] ?? null;

  return {
    totalLessons: total,
    completedLessons,
    completionRate,
    latestLessonId: latest?.lesson_id ?? null,
    latestPosition: latest?.last_position ?? 0
  };
}
