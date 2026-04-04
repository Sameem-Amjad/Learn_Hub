import type { SubscriptionTier } from "@/types/subscription";

export const tierLevels: Record<SubscriptionTier, number> = {
  insider: 1,
  core: 2,
  pro: 3
};

export const PRICE_ID_TO_TIER: Record<string, SubscriptionTier> = {
  [process.env.STRIPE_PRICE_INSIDER ?? ""]: "insider",
  [process.env.STRIPE_PRICE_CORE ?? ""]: "core",
  [process.env.STRIPE_PRICE_PRO ?? ""]: "pro"
};

export function hasAccess(userTier: SubscriptionTier, requiredTier: SubscriptionTier): boolean {
  return tierLevels[userTier] >= tierLevels[requiredTier];
}

export function getTierFromPriceId(priceId: string): SubscriptionTier | null {
  return PRICE_ID_TO_TIER[priceId] ?? null;
}
