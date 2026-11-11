import { NextResponse } from "next/server";
import { z } from "zod";

import { createServiceRoleClient, getCurrentUser } from "@/lib/supabase/server";

const createSchema = z.object({
  lessonId: z.string().uuid(),
  content: z.string().trim().min(1).max(2000),
  timestamp: z.number().int().nonnegative().max(24 * 3600).optional()
});

export async function GET(req: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const lessonId = searchParams.get("lessonId");

  if (!lessonId) {
    return NextResponse.json({ error: "lessonId is required" }, { status: 400 });
  }

  const client = createServiceRoleClient();
  const { data, error } = await client
    .from("notes")
    .select("*")
    .eq("user_id", user.id)
    .eq("lesson_id", lessonId)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ notes: data });
}

export async function POST(req: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = createSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Write a note of up to 2,000 characters." }, { status: 400 });
  }
  const body = parsed.data;
  const client = createServiceRoleClient();
  const { data, error } = await client
    .from("notes")
    .insert({
      user_id: user.id,
      lesson_id: body.lessonId,
      content: body.content,
      timestamp: body.timestamp ?? null
    })
    .select("id,content,timestamp,created_at")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ note: data });
}
