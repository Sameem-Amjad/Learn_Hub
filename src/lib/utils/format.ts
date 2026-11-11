import type { SubscriptionTier } from "@/types/subscription";

export const TIER_LABEL: Record<SubscriptionTier, string> = { insider: "Insider", core: "Core", pro: "Pro" };

export const STATUS_LABEL: Record<string, string> = {
  active: "Active",
  trialing: "Trial",
  past_due: "Past due",
  canceled: "Canceled",
  incomplete: "Incomplete"
};

/** 760 → "12:40" */
export function clock(seconds: number | null | undefined) {
  const s = Math.max(0, Math.round(seconds ?? 0));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

/** 760 → "13 min" */
export function minutes(seconds: number | null | undefined) {
  return `${Math.max(1, Math.round((seconds ?? 0) / 60))} min`;
}

export function shortDate(iso: string | null | undefined) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}
