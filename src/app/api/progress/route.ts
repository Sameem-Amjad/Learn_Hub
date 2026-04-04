import { NextResponse } from "next/server";
import { z } from "zod";

import { createServiceRoleClient, createServerSupabaseClient } from "@/lib/supabase/server";

const schema = z.object({
  lessonId: z.string().uuid(),
  completed: z.boolean().optional(),
  lastPosition: z.number().int().nonnegative().optional()
});

export async function POST(req: Request) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = schema.parse(await req.json());
  const client = createServiceRoleClient();

  const payload = {
    user_id: user.id,
    lesson_id: body.lessonId,
    completed: body.completed ?? false,
    last_position: body.lastPosition ?? 0,
    completed_at: body.completed ? new Date().toISOString() : null,
    updated_at: new Date().toISOString()
  };

  const { error } = await client.from("user_progress").upsert(payload, {
    onConflict: "user_id,lesson_id"
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
