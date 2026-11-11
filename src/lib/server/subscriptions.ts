import { createServiceRoleClient } from "@/lib/supabase/server";
import type { SubscriptionTier } from "@/types/subscription";

/**
 * Switch a plan on without Stripe: an admin grant, or a demo-mode checkout.
 * The row keeps a recognisable id so it is never mistaken for a Stripe one.
 */
export async function activatePlan(userIds: string[], tier: SubscriptionTier, opts: { days?: number; source: "admin" | "demo" }) {
  const supabase = createServiceRoleClient();
  const now = new Date();
  const end = new Date(now);
  end.setDate(end.getDate() + (opts.days ?? 30));

  const rows = userIds.map((userId) => ({
    user_id: userId,
    stripe_subscription_id: `${opts.source === "admin" ? "manual" : "demo"}_${userId}`,
    stripe_price_id: `${opts.source}_${tier}`,
    tier,
    status: "active",
    current_period_start: now.toISOString(),
    current_period_end: end.toISOString(),
    cancel_at_period_end: false,
    updated_at: now.toISOString()
  }));

  const { error } = await supabase.from("subscriptions").upsert(rows, { onConflict: "user_id" });
  if (error) throw new Error(error.message);
}

/** End access now: the plan stays on record as canceled. Returns how many plans changed. */
export async function revokePlans(userIds: string[]) {
  const supabase = createServiceRoleClient();
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("subscriptions")
    .update({ status: "canceled", cancel_at_period_end: true, current_period_end: now, updated_at: now })
    .in("user_id", userIds)
    .select("user_id");

  if (error) throw new Error(error.message);
  return (data ?? []).length;
}

/** Ids that exist as LearnHub users, out of the ones given. */
export async function existingUserIds(userIds: string[]) {
  const supabase = createServiceRoleClient();
  const { data } = await supabase.from("users").select("id").in("id", userIds);
  return new Set(((data ?? []) as { id: string }[]).map((r) => r.id));
}
