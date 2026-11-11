import type { User } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

import { DEMO_ADMIN_BLOCKED, isEditableByDemoAdmin, isNoDeleteUser } from "@/lib/demo";
import { createServiceRoleClient, getCurrentUser } from "@/lib/supabase/server";

export async function isAdminUser(userId: string): Promise<boolean> {
  const supabase = createServiceRoleClient();
  const { data } = await supabase
    .from("user_roles")
    .select("role_id, roles!inner(name)")
    .eq("user_id", userId)
    .eq("roles.name", "admin")
    .limit(1);

  return (data ?? []).length > 0;
}

export async function requireAdmin(): Promise<
  { user: User; errorResponse: null } | { user: null; errorResponse: NextResponse }
> {
  const user = await getCurrentUser();

  if (!user?.email) {
    return { user: null, errorResponse: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  if (!(await isAdminUser(user.id))) {
    return { user: null, errorResponse: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }

  return { user, errorResponse: null };
}

/**
 * For demo admins (app_metadata.no_delete): a 403 unless every target is a
 * seeded sample learner. Real admins pass straight through.
 */
export async function guardDemoAdminTargets(actor: User, userIds: string[]): Promise<NextResponse | null> {
  if (!isNoDeleteUser(actor)) {
    return null;
  }

  const supabase = createServiceRoleClient();
  const { data } = await supabase.from("users").select("id,email").in("id", userIds);
  const rows = (data ?? []) as { id: string; email: string }[];
  const allowed = rows.length === userIds.length && rows.every((r) => isEditableByDemoAdmin(r.email));

  return allowed ? null : NextResponse.json({ error: DEMO_ADMIN_BLOCKED }, { status: 403 });
}
