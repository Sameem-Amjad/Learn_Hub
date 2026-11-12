import { NextResponse } from "next/server";
import { z } from "zod";

import { getUserTier } from "@/lib/server/learning-data";
import { createServiceRoleClient, getCurrentUser } from "@/lib/supabase/server";
import { hasAccess } from "@/lib/utils/tier-comparison";
import type { SubscriptionTier } from "@/types/subscription";

const schema = z.object({
  lessonId: z.string().uuid(),
  completed: z.boolean().optional(),
  lastPosition: z.number().int().nonnegative().max(24 * 3600).optional()
});

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const body = parsed.data;
  const client = createServiceRoleClient();

  // Only lessons the learner can open: previews, or their plan's tier.
  const { data: lesson } = await client
    .from("lessons")
    .select("id,is_preview,modules!inner(courses!inner(required_tier,is_published))")
    .eq("id", body.lessonId)
    .maybeSingle();
  const course = (lesson as { is_preview: boolean; modules: { courses: { required_tier: SubscriptionTier; is_published: boolean } } } | null);
  if (!course || !course.modules.courses.is_published) {
    return NextResponse.json({ error: "Lesson not found" }, { status: 404 });
  }
  if (!course.is_preview) {
    const tier = await getUserTier(user.id);
    if (!tier || !hasAccess(tier, course.modules.courses.required_tier)) {
      return NextResponse.json({ error: "This lesson needs a higher plan" }, { status: 403 });
    }
  }

  // A finished lesson stays finished when it is watched again. Position saves
  // never write `completed` at all, so one that races a completion (a video's
  // pause and ended events fire together) can't undo it.
  const { data: existing } = await client
    .from("user_progress")
    .select("completed,completed_at")
    .eq("user_id", user.id)
    .eq("lesson_id", body.lessonId)
    .maybeSingle();
  const prior = existing as { completed: boolean; completed_at: string | null } | null;
  const now = new Date().toISOString();
  const position = { user_id: user.id, lesson_id: body.lessonId, last_position: body.lastPosition ?? 0, updated_at: now };

  const { error } = await client
    .from("user_progress")
    .upsert(body.completed ? { ...position, completed: true, completed_at: prior?.completed_at ?? now } : position, {
      onConflict: "user_id,lesson_id"
    });
  const completed = Boolean(prior?.completed || body.completed);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true, completed });
}
