import { NextResponse } from "next/server";
import { z } from "zod";

import { isEditableByDemoAdmin, isNoDeleteUser } from "@/lib/demo";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/utils/admin-auth";

const querySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().max(120).optional(),
  tier: z.enum(["insider", "core", "pro"]).optional(),
  status: z.enum(["active", "canceled", "past_due", "incomplete", "trialing"]).optional(),
  role: z.enum(["admin", "member"]).optional()
});

/** Characters with a meaning inside a PostgREST or() filter, or in ILIKE. */
const clean = (s: string) => s.replace(/[,()*%\\]/g, " ").trim();

export async function GET(req: Request) {
  const { errorResponse, user: actor } = await requireAdmin();
  if (errorResponse) {
    return errorResponse;
  }

  const params = new URL(req.url).searchParams;
  const parsed = querySchema.safeParse({
    page: params.get("page") ?? "1",
    pageSize: params.get("pageSize") ?? "20",
    search: params.get("search") || undefined,
    tier: params.get("tier") || undefined,
    status: params.get("status") || undefined,
    role: params.get("role") || undefined
  });

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { page, pageSize, search, tier, status, role } = parsed.data;
  const from = (page - 1) * pageSize;

  const supabase = createServiceRoleClient();
  let query = supabase
    .from("user_directory")
    .select("id,email,full_name,created_at,tier,status,current_period_end,is_admin", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, from + pageSize - 1);

  const term = search ? clean(search) : "";
  if (term) query = query.or(`email.ilike.*${term}*,full_name.ilike.*${term}*`);
  if (tier) query = query.eq("tier", tier);
  if (status) query = query.eq("status", status);
  if (role) query = query.eq("is_admin", role === "admin");

  const { data, count, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const demoAdmin = isNoDeleteUser(actor);
  type Row = { id: string; email: string; full_name: string | null; created_at: string; tier: string | null; status: string | null; current_period_end: string | null; is_admin: boolean };
  const total = count ?? 0;

  return NextResponse.json({
    users: ((data ?? []) as Row[]).map((u) => ({
      id: u.id,
      email: u.email,
      full_name: u.full_name,
      created_at: u.created_at,
      is_admin: u.is_admin,
      editable: !demoAdmin || isEditableByDemoAdmin(u.email),
      subscription: u.tier ? { tier: u.tier, status: u.status, current_period_end: u.current_period_end } : null
    })),
    pagination: { page, pageSize, total, totalPages: Math.max(1, Math.ceil(total / pageSize)) }
  });
}
