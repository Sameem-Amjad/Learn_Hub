import { NextResponse } from "next/server";
import { z } from "zod";

import { createServiceRoleClient, createServerSupabaseClient } from "@/lib/supabase/server";

const createSchema = z.object({
  lessonId: z.string().uuid(),
  content: z.string().min(1),
  timestamp: z.number().int().nonnegative().optional()
});

export async function GET(req: Request) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

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
  const supabase = await createServerSupabaseClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = createSchema.parse(await req.json());
  const client = createServiceRoleClient();
  const { data, error } = await client
    .from("notes")
    .insert({
      user_id: user.id,
      lesson_id: body.lessonId,
      content: body.content,
      timestamp: body.timestamp ?? null
    })
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ note: data });
}
