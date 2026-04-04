import { NextResponse } from "next/server";

import { createServiceRoleClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/utils/admin-auth";

export async function GET() {
  const { errorResponse } = await requireAdmin();
  if (errorResponse) {
    return errorResponse;
  }

  const supabase = createServiceRoleClient();

  const [
    { count: usersCount },
    { data: subscriptions },
    { count: coursesCount },
    { count: lessonsCount },
    { data: progressRows }
  ] = await Promise.all([
    supabase.from("users").select("id", { count: "exact", head: true }),
    supabase.from("subscriptions").select("tier,status"),
    supabase.from("courses").select("id", { count: "exact", head: true }).eq("is_published", true),
    supabase.from("lessons").select("id", { count: "exact", head: true }),
    supabase.from("user_progress").select("completed")
  ]);

  const activeSubs = (subscriptions ?? []).filter((sub) => sub.status === "active" || sub.status === "trialing");

  const byTier = {
    insider: activeSubs.filter((sub) => sub.tier === "insider").length,
    core: activeSubs.filter((sub) => sub.tier === "core").length,
    pro: activeSubs.filter((sub) => sub.tier === "pro").length
  };

  const totalProgress = (progressRows ?? []).length;
  const completedProgress = (progressRows ?? []).filter((row) => row.completed).length;

  return NextResponse.json({
    users: usersCount ?? 0,
    activeSubscriptions: activeSubs.length,
    byTier,
    publishedCourses: coursesCount ?? 0,
    lessons: lessonsCount ?? 0,
    completionRate: totalProgress > 0 ? Math.round((completedProgress / totalProgress) * 100) : 0
  });
}
