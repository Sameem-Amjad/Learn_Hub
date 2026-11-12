import type { SubscriptionTier } from "@/types/subscription";

export const tierLevels: Record<SubscriptionTier, number> = {
  insider: 1,
  core: 2,
  pro: 3
};

/** Monthly and yearly Stripe price ids, mapped back to their tier (unset ones are skipped). */
export const PRICE_ID_TO_TIER: Record<string, SubscriptionTier> = Object.fromEntries(
  (
    [
      [process.env.STRIPE_PRICE_INSIDER, "insider"],
      [process.env.STRIPE_PRICE_INSIDER_YEARLY, "insider"],
      [process.env.STRIPE_PRICE_CORE, "core"],
      [process.env.STRIPE_PRICE_CORE_YEARLY, "core"],
      [process.env.STRIPE_PRICE_PRO, "pro"],
      [process.env.STRIPE_PRICE_PRO_YEARLY, "pro"]
    ] as const
  ).filter(([id]) => Boolean(id)) as [string, SubscriptionTier][]
);

export function hasAccess(userTier: SubscriptionTier, requiredTier: SubscriptionTier): boolean {
  return tierLevels[userTier] >= tierLevels[requiredTier];
}

export function getTierFromPriceId(priceId: string): SubscriptionTier | null {
  return PRICE_ID_TO_TIER[priceId] ?? null;
}
