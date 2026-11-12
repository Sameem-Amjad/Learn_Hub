import { cache } from "react";

import { createServiceRoleClient } from "@/lib/supabase/server";
import { planIsLive } from "@/lib/utils/plan";
import { hasAccess } from "@/lib/utils/tier-comparison";
import type { SubscriptionTier } from "@/types/subscription";

// Server-side reads with the service role. Every caller has already checked
// who is signed in; tier checks happen here or in the page.

export type LessonRow = {
  id: string;
  module_id: string;
  title: string;
  slug: string;
  content: string | null;
  video_url: string | null;
  duration: number | null;
  is_preview: boolean;
  order_index: number;
};

export type ModuleRow = {
  id: string;
  course_id: string;
  title: string;
  slug: string;
  description: string | null;
  order_index: number;
  lessons: LessonRow[];
};

export type CourseWithModules = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  thumbnail_url: string | null;
  required_tier: SubscriptionTier;
  modules: ModuleRow[];
};

export type LessonProgress = { completed: boolean; last_position: number; updated_at: string };

export const getSubscription = cache(async (userId: string) => {
  const supabase = createServiceRoleClient();
  const { data } = await supabase
    .from("subscriptions")
    .select("tier,status,current_period_start,current_period_end,cancel_at_period_end,stripe_subscription_id")
    .eq("user_id", userId)
    .maybeSingle();

  return data as {
    tier: SubscriptionTier;
    status: string;
    current_period_start: string | null;
    current_period_end: string | null;
    cancel_at_period_end: boolean;
    stripe_subscription_id: string;
  } | null;
});

/** The tier the user can use right now (see planIsLive). */
export const getUserTier = cache(async (userId: string): Promise<SubscriptionTier | null> => {
  const sub = await getSubscription(userId);
  return sub && planIsLive(sub) ? sub.tier : null;
});

export const getProfile = cache(async (userId: string) => {
  const supabase = createServiceRoleClient();
  const { data } = await supabase.from("users").select("id,email,full_name,avatar_url,created_at").eq("id", userId).maybeSingle();
  return data as { id: string; email: string; full_name: string | null; avatar_url: string | null; created_at: string } | null;
});

/** Published courses with lesson counts, the user's completed count and whether their plan unlocks each. */
export async function getCoursesForUser(userId: string) {
  const supabase = createServiceRoleClient();
  const [userTier, coursesRes, progress] = await Promise.all([
    getUserTier(userId),
    supabase
      .from("courses")
      .select("id,title,slug,description,thumbnail_url,required_tier,is_published,order_index,modules(lessons(id,is_preview))")
      .eq("is_published", true)
      .order("order_index", { ascending: true }),
    getProgressMap(userId)
  ]);

  type Row = {
    id: string; title: string; slug: string; description: string | null; thumbnail_url: string | null;
    required_tier: SubscriptionTier; is_published: boolean; order_index: number;
    modules: { lessons: { id: string; is_preview: boolean }[] }[];
  };

  return ((coursesRes.data ?? []) as Row[]).map((course) => {
    const lessons = course.modules.flatMap((m) => m.lessons);
    return {
      id: course.id,
      title: course.title,
      slug: course.slug,
      description: course.description,
      thumbnail_url: course.thumbnail_url,
      required_tier: course.required_tier,
      is_published: course.is_published,
      order_index: course.order_index,
      lesson_count: lessons.length,
      preview_count: lessons.filter((l) => l.is_preview).length,
      completed_count: lessons.filter((l) => progress.get(l.id)?.completed).length,
      has_access: userTier ? hasAccess(userTier, course.required_tier) : false
    };
  });
}

export const getCourseWithModules = cache(async (courseSlug: string): Promise<CourseWithModules | null> => {
  const supabase = createServiceRoleClient();
  const { data } = await supabase
    .from("courses")
    .select(
      "id,title,slug,description,thumbnail_url,required_tier,modules(id,course_id,title,slug,description,order_index,lessons(id,module_id,title,slug,content,video_url,duration,is_preview,order_index))"
    )
    .eq("slug", courseSlug)
    .eq("is_published", true)
    .order("order_index", { referencedTable: "modules", ascending: true })
    .order("order_index", { referencedTable: "modules.lessons", ascending: true })
    .maybeSingle();

  return (data as CourseWithModules | null) ?? null;
});

/** lesson id → the user's progress on it. */
export const getProgressMap = cache(async (userId: string) => {
  const supabase = createServiceRoleClient();
  const { data } = await supabase
    .from("user_progress")
    .select("lesson_id,completed,last_position,updated_at")
    .eq("user_id", userId);

  return new Map(
    ((data ?? []) as ({ lesson_id: string } & LessonProgress)[]).map((r) => [
      r.lesson_id,
      { completed: r.completed, last_position: r.last_position, updated_at: r.updated_at }
    ])
  );
});

/** Overall progress across published courses, plus the lesson to pick up next. */
export async function getDashboardProgress(userId: string) {
  const supabase = createServiceRoleClient();
  const [lessonsRes, progress] = await Promise.all([
    supabase
      .from("lessons")
      .select("id,title,slug,duration,order_index,modules!inner(slug,title,order_index,courses!inner(id,slug,title,order_index,is_published))")
      .eq("modules.courses.is_published", true),
    getProgressMap(userId)
  ]);

  type Row = {
    id: string; title: string; slug: string; duration: number | null; order_index: number;
    modules: { slug: string; title: string; order_index: number; courses: { id: string; slug: string; title: string; order_index: number; is_published: boolean } };
  };
  // Course order, then module order, then lesson order.
  const lessons = ((lessonsRes.data ?? []) as unknown as Row[]).sort(
    (a, b) =>
      a.modules.courses.order_index - b.modules.courses.order_index ||
      a.modules.order_index - b.modules.order_index ||
      a.order_index - b.order_index
  );

  const totalLessons = lessons.length;
  const completedLessons = lessons.filter((l) => progress.get(l.id)?.completed).length;
  const completionRate = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

  // The most recently touched lesson; if it is finished, the next unfinished one in the same course.
  const touched = lessons
    .filter((l) => progress.has(l.id))
    .sort((a, b) => progress.get(b.id)!.updated_at.localeCompare(progress.get(a.id)!.updated_at))[0];
  let pick = touched ?? null;
  let upNext = false;
  if (touched && progress.get(touched.id)?.completed) {
    const sameCourse = lessons.filter((l) => l.modules.courses.id === touched.modules.courses.id);
    const after = sameCourse.slice(sameCourse.findIndex((l) => l.id === touched.id) + 1);
    const next = after.find((l) => !progress.get(l.id)?.completed) ?? sameCourse.find((l) => !progress.get(l.id)?.completed);
    if (next) {
      pick = next;
      upNext = true;
    }
  }
  const state = pick ? progress.get(pick.id) : undefined;

  return {
    totalLessons,
    completedLessons,
    completionRate,
    latestLessonId: touched?.id ?? null,
    latestPosition: touched ? (progress.get(touched.id)?.last_position ?? 0) : 0,
    resume: pick
      ? {
          title: pick.title,
          courseTitle: pick.modules.courses.title,
          moduleTitle: pick.modules.title,
          href: `/courses/${pick.modules.courses.slug}/${pick.modules.slug}/${pick.slug}`,
          position: state?.last_position ?? 0,
          duration: pick.duration,
          completed: Boolean(state?.completed),
          upNext
        }
      : null
  };
}

export async function getNotesForLesson(userId: string, lessonId: string) {
  const supabase = createServiceRoleClient();
  const { data } = await supabase
    .from("notes")
    .select("id,content,timestamp,created_at")
    .eq("user_id", userId)
    .eq("lesson_id", lessonId)
    .order("created_at", { ascending: false });

  return (data ?? []) as { id: string; content: string; timestamp: number | null; created_at: string }[];
}

export async function getMediaLibrary() {
  const supabase = createServiceRoleClient();
  const { data } = await supabase
    .from("media_library")
    .select("id,title,description,type,required_tier,duration,pages,cover_url")
    .order("created_at", { ascending: true });

  return (data ?? []) as {
    id: string; title: string; description: string | null; type: "pdf" | "epub" | "audio";
    required_tier: SubscriptionTier; duration: number | null; pages: number | null; cover_url: string | null;
  }[];
}

export async function getMediaItem(mediaId: string) {
  const supabase = createServiceRoleClient();
  const { data } = await supabase
    .from("media_library")
    .select("id,title,description,type,required_tier,duration,pages,cover_url")
    .eq("id", mediaId)
    .maybeSingle();

  return data as Awaited<ReturnType<typeof getMediaLibrary>>[number] | null;
}
