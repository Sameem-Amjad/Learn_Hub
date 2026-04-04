import { NextResponse } from "next/server";

import { createServiceRoleClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/utils/admin-auth";

export async function GET() {
  const { errorResponse } = await requireAdmin();
  if (errorResponse) {
    return errorResponse;
  }

  const supabase = createServiceRoleClient();

  const [{ data: users, error: usersError }, { data: subscriptions, error: subsError }] = await Promise.all([
    supabase.from("users").select("id,email,full_name,created_at").order("created_at", { ascending: false }),
    supabase.from("subscriptions").select("user_id,tier,status,current_period_end")
  ]);

  if (usersError || subsError) {
    return NextResponse.json({ error: usersError?.message ?? subsError?.message ?? "Failed to fetch users" }, { status: 400 });
  }

  const subscriptionMap = new Map((subscriptions ?? []).map((sub) => [sub.user_id, sub]));

  const payload = (users ?? []).map((user) => {
    const subscription = subscriptionMap.get(user.id);
    return {
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      created_at: user.created_at,
      subscription: subscription
        ? {
            tier: subscription.tier,
            status: subscription.status,
            current_period_end: subscription.current_period_end
          }
        : null
    };
  });

  return NextResponse.json({ users: payload });
}
