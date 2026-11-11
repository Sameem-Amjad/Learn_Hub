import { NextResponse } from "next/server";
import { z } from "zod";

import { createServiceRoleClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/utils/admin-auth";

const querySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10),
  action: z.string().trim().max(80).optional(),
  entityType: z.string().trim().max(80).optional()
});

export async function GET(req: Request) {
  const { errorResponse } = await requireAdmin();
  if (errorResponse) {
    return errorResponse;
  }

  const params = new URL(req.url).searchParams;
  const parsed = querySchema.safeParse({
    page: params.get("page") ?? "1",
    pageSize: params.get("pageSize") ?? "10",
    action: params.get("action") ?? undefined,
    entityType: params.get("entityType") ?? undefined
  });

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { page, pageSize, action, entityType } = parsed.data;
  const from = (page - 1) * pageSize;

  const supabase = createServiceRoleClient();
  let query = supabase
    .from("admin_audit_logs")
    .select("id,action,entity_type,entity_id,metadata,created_at,actor:actor_user_id(id,email,full_name)", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, from + pageSize - 1);

  if (action) query = query.eq("action", action);
  if (entityType) query = query.eq("entity_type", entityType);

  const { data, count, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Name what each entry touched: a user's name or email, or a course's title.
  type Log = { id: string; action: string; entity_type: string; entity_id: string | null; metadata: Record<string, unknown> | null; created_at: string; actor: unknown };
  const logs = (data ?? []) as Log[];
  const userIds = [...new Set(logs.filter((l) => l.entity_type === "user" && l.entity_id).map((l) => l.entity_id!))];
  const courseIds = [
    ...new Set(
      logs
        .filter((l) => l.entity_type === "course")
        .flatMap((l) => [l.entity_id, ...((l.metadata?.ids as string[] | undefined) ?? [])])
        .filter((id): id is string => Boolean(id))
    )
  ];
  const [usersRes, coursesRes] = await Promise.all([
    userIds.length ? supabase.from("users").select("id,email,full_name").in("id", userIds) : Promise.resolve({ data: [] }),
    courseIds.length ? supabase.from("courses").select("id,title").in("id", courseIds) : Promise.resolve({ data: [] })
  ]);
  const userName = new Map(((usersRes.data ?? []) as { id: string; email: string; full_name: string | null }[]).map((u) => [u.id, u.full_name ?? u.email]));
  const courseName = new Map(((coursesRes.data ?? []) as { id: string; title: string }[]).map((c) => [c.id, c.title]));
  const describe = (l: Log) => {
    const ids = (l.metadata?.ids as string[] | undefined) ?? (l.entity_id ? [l.entity_id] : []);
    const names = ids.map((id) => (l.entity_type === "course" ? courseName.get(id) : userName.get(id)) ?? "a removed record");
    return names.length > 2 ? `${names.slice(0, 2).join(", ")} and ${names.length - 2} more` : names.join(", ");
  };

  const total = count ?? 0;
  return NextResponse.json({
    logs: logs.map((l) => ({ ...l, target: describe(l) })),
    pagination: { page, pageSize, total, totalPages: Math.max(1, Math.ceil(total / pageSize)) }
  });
}
