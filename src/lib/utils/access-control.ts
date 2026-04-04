import { cache } from "react";

import { createServiceRoleClient } from "@/lib/supabase/server";
import { hasAccess } from "@/lib/utils/tier-comparison";
import type { SubscriptionTier } from "@/types/subscription";

export const getActiveSubscription = cache(async (userId: string) => {
  const supabase = createServiceRoleClient();
  const { data } = await supabase
    .from("subscriptions")
    .select("tier,status,current_period_end")
    .eq("user_id", userId)
    .in("status", ["active", "trialing"])
    .maybeSingle();

  return data;
});

export async function checkCourseAccess(userId: string, courseId: string): Promise<boolean> {
  const supabase = createServiceRoleClient();
  const subscription = await getActiveSubscription(userId);

  if (!subscription) {
    return false;
  }

  const { data: course } = await supabase
    .from("courses")
    .select("required_tier")
    .eq("id", courseId)
    .maybeSingle();

  if (!course) {
    return false;
  }

  return hasAccess(subscription.tier as SubscriptionTier, course.required_tier as SubscriptionTier);
}

export async function checkMediaAccess(userId: string, mediaId: string): Promise<boolean> {
  const supabase = createServiceRoleClient();
  const subscription = await getActiveSubscription(userId);

  if (!subscription) {
    return false;
  }

  const { data: media } = await supabase
    .from("media_library")
    .select("required_tier")
    .eq("id", mediaId)
    .maybeSingle();

  if (!media) {
    return false;
  }

  return hasAccess(subscription.tier as SubscriptionTier, media.required_tier as SubscriptionTier);
}
