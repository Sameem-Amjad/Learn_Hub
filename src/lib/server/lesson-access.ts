import { getUserTier } from "@/lib/server/learning-data";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { hasAccess } from "@/lib/utils/tier-comparison";
import type { SubscriptionTier } from "@/types/subscription";

/**
 * Can this learner open the lesson? Preview lessons in a published course are
 * open to everyone signed in; the rest need the course's tier or higher.
 */
export async function lessonAccess(userId: string, lessonId: string): Promise<"ok" | "missing" | "locked"> {
  const client = createServiceRoleClient();
  const { data } = await client
    .from("lessons")
    .select("id,is_preview,modules!inner(courses!inner(required_tier,is_published))")
    .eq("id", lessonId)
    .maybeSingle();
  const lesson = data as { is_preview: boolean; modules: { courses: { required_tier: SubscriptionTier; is_published: boolean } } } | null;

  if (!lesson || !lesson.modules.courses.is_published) return "missing";
  if (lesson.is_preview) return "ok";
  const tier = await getUserTier(userId);
  return tier && hasAccess(tier, lesson.modules.courses.required_tier) ? "ok" : "locked";
}

export const LESSON_DENIED = {
  missing: { error: "Lesson not found", status: 404 },
  locked: { error: "This lesson needs a higher plan", status: 403 }
} as const;
