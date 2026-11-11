import { NextResponse } from "next/server";
import { z } from "zod";

import { isEditableByDemoAdmin, isNoDeleteUser } from "@/lib/demo";
import { writeAdminAuditLog } from "@/lib/server/admin-audit";
import { existingUserIds } from "@/lib/server/subscriptions";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { guardDemoAdminTargets, requireAdmin } from "@/lib/utils/admin-auth";

const getQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10),
  search: z.string().trim().max(120).optional()
});

const roleMutationSchema = z.object({
  userId: z.string().uuid(),
  role: z.literal("admin").default("admin")
});

const clean = (s: string) => s.replace(/[,()*%\\]/g, " ").trim();

async function adminRoleId() {
  const supabase = createServiceRoleClient();
  const { data } = await supabase.from("roles").select("id").eq("name", "admin").maybeSingle();
  return (data as { id: number } | null)?.id ?? null;
}

export async function GET(req: Request) {
  const { errorResponse, user: actor } = await requireAdmin();
  if (errorResponse) {
    return errorResponse;
  }

  const params = new URL(req.url).searchParams;
  const parsed = getQuerySchema.safeParse({
    page: params.get("page") ?? "1",
    pageSize: params.get("pageSize") ?? "10",
    search: params.get("search") || undefined
  });

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { page, pageSize, search } = parsed.data;
  const from = (page - 1) * pageSize;
  const supabase = createServiceRoleClient();

  let query = supabase
    .from("user_directory")
    .select("id,email,full_name,created_at,is_admin", { count: "exact" })
    .order("is_admin", { ascending: false })
    .order("created_at", { ascending: false })
    .range(from, from + pageSize - 1);

  const term = search ? clean(search) : "";
  if (term) query = query.or(`email.ilike.*${term}*,full_name.ilike.*${term}*`);

  const { data, count, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const demoAdmin = isNoDeleteUser(actor);
  const total = count ?? 0;
  type Row = { id: string; email: string; full_name: string | null; created_at: string; is_admin: boolean };

  return NextResponse.json({
    users: ((data ?? []) as Row[]).map((u) => ({
      ...u,
      editable: !demoAdmin || (isEditableByDemoAdmin(u.email) && !u.is_admin)
    })),
    pagination: { page, pageSize, total, totalPages: Math.max(1, Math.ceil(total / pageSize)) }
  });
}

export async function POST(req: Request) {
  const { errorResponse, user } = await requireAdmin();
  if (errorResponse) {
    return errorResponse;
  }

  const parsed = roleMutationSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { userId } = parsed.data;
  const roleId = await adminRoleId();
  if (!roleId) {
    return NextResponse.json({ error: "Admin role not found" }, { status: 500 });
  }

  if (!(await existingUserIds([userId])).has(userId)) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const blocked = await guardDemoAdminTargets(user, [userId]);
  if (blocked) return blocked;

  const supabase = createServiceRoleClient();
  const { error } = await supabase
    .from("user_roles")
    .upsert({ user_id: userId, role_id: roleId, created_by: user.id }, { onConflict: "user_id,role_id", ignoreDuplicates: true });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await writeAdminAuditLog({ actorUserId: user.id, action: "assign_admin_role", entityType: "user", entityId: userId });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  const { errorResponse, user } = await requireAdmin();
  if (errorResponse) {
    return errorResponse;
  }

  if (isNoDeleteUser(user)) {
    return NextResponse.json({ error: "The demo admin can't remove admin roles." }, { status: 403 });
  }

  const parsed = roleMutationSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { userId } = parsed.data;
  const roleId = await adminRoleId();
  if (!roleId) {
    return NextResponse.json({ error: "Admin role not found" }, { status: 500 });
  }

  const supabase = createServiceRoleClient();
  const [{ count }, { data: target }] = await Promise.all([
    supabase.from("user_roles").select("user_id", { count: "exact", head: true }).eq("role_id", roleId),
    supabase.from("user_roles").select("user_id").eq("role_id", roleId).eq("user_id", userId).maybeSingle()
  ]);

  if (!target) {
    return NextResponse.json({ error: "User is not an admin" }, { status: 400 });
  }

  if ((count ?? 0) <= 1) {
    return NextResponse.json({ error: "Cannot remove the last admin" }, { status: 400 });
  }

  const { error } = await supabase.from("user_roles").delete().eq("role_id", roleId).eq("user_id", userId);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await writeAdminAuditLog({ actorUserId: user.id, action: "remove_admin_role", entityType: "user", entityId: userId });
  return NextResponse.json({ ok: true });
}
