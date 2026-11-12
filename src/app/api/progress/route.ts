import { NextResponse } from "next/server";
import { z } from "zod";

import { LESSON_DENIED, lessonAccess } from "@/lib/server/lesson-access";
import { createServiceRoleClient, getCurrentUser } from "@/lib/supabase/server";

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
  const access = await lessonAccess(user.id, body.lessonId);
  if (access !== "ok") {
    return NextResponse.json({ error: LESSON_DENIED[access].error }, { status: LESSON_DENIED[access].status });
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
