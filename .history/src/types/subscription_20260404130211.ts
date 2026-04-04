export type SubscriptionTier = "insider" | "core" | "pro";

export type SubscriptionStatus =
  | "active"
  | "canceled"
  | "past_due"
  | "incomplete"
  | "trialing";

export interface Subscription {
  id: string;
  user_id: string;
  stripe_subscription_id: string;
  stripe_price_id: string;
  tier: SubscriptionTier;
  status: SubscriptionStatus;
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  created_at: string;
  updated_at: string;
}
