import { NextResponse } from "next/server";

import { createServiceRoleClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/utils/admin-auth";

export async function GET() {
  const { errorResponse } = await requireAdmin();
  if (errorResponse) {
    return errorResponse;
  }

  const supabase = createServiceRoleClient();
  const [users, subscriptions, courses, lessons, progress] = await Promise.all([
    supabase.from("users").select("id", { count: "exact", head: true }),
    supabase.from("subscriptions").select("tier,status"),
    supabase.from("courses").select("id", { count: "exact", head: true }).eq("is_published", true),
    supabase.from("lessons").select("id", { count: "exact", head: true }),
    supabase.from("user_progress").select("completed")
  ]);

  const subs = (subscriptions.data ?? []) as { tier: string; status: string }[];
  const activeSubs = subs.filter((sub) => sub.status === "active" || sub.status === "trialing");
  const rows = (progress.data ?? []) as { completed: boolean }[];
  const completed = rows.filter((row) => row.completed).length;

  return NextResponse.json({
    users: users.count ?? 0,
    activeSubscriptions: activeSubs.length,
    byTier: {
      insider: activeSubs.filter((sub) => sub.tier === "insider").length,
      core: activeSubs.filter((sub) => sub.tier === "core").length,
      pro: activeSubs.filter((sub) => sub.tier === "pro").length
    },
    pastDue: subs.filter((sub) => sub.status === "past_due").length,
    publishedCourses: courses.count ?? 0,
    lessons: lessons.count ?? 0,
    completionRate: rows.length > 0 ? Math.round((completed / rows.length) * 100) : 0
  });
}
