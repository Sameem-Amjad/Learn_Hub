"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";
import type { SubscriptionTier } from "@/types/subscription";

export type PlanInfo = { key: SubscriptionTier; name: string; monthly: number; blurb: string; features: string[] };

export function PricingPlans({
  plans,
  currentTier,
  signedIn,
  demoMode,
  highlight,
  levels
}: {
  plans: PlanInfo[];
  currentTier: SubscriptionTier | null;
  signedIn: boolean;
  demoMode: boolean;
  highlight: SubscriptionTier;
  levels: Record<SubscriptionTier, number>;
}) {
  const router = useRouter();
  const [yearly, setYearly] = useState(false);
  const [busy, setBusy] = useState<SubscriptionTier | null>(null);

  async function choose(tier: SubscriptionTier) {
    if (!signedIn) {
      router.push(`/signup?next=${encodeURIComponent("/pricing")}`);
      return;
    }
    try {
      setBusy(tier);
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier, interval: yearly ? "year" : "month" })
      });
      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !data.url) {
        toast.error(data.error ?? "Checkout could not start.");
        return;
      }
      window.location.href = data.url;
    } catch {
      toast.error("Checkout could not start.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <>
      <div className="mt-8 flex flex-wrap items-center gap-3">
        <div role="group" aria-label="Billing period" className="inline-flex rounded-full border border-border p-1 text-sm">
          {[false, true].map((y) => (
            <button
              key={String(y)}
              type="button"
              aria-pressed={yearly === y}
              onClick={() => setYearly(y)}
              className={cn("rounded-full px-4 py-1.5", yearly === y ? "bg-primary text-primary-foreground" : "text-muted-foreground")}
            >
              {y ? "Yearly (save 10%)" : "Monthly"}
            </button>
          ))}
        </div>
        {demoMode ? (
          <p className="text-sm text-muted-foreground">Demo mode: choosing a plan switches it on straight away. No card, nothing charged.</p>
        ) : null}
      </div>

      <div className="mt-8 grid gap-6 md:grid-cols-3">
        {plans.map((plan) => {
          const price = yearly ? Math.round(plan.monthly * 12 * 0.9) : plan.monthly;
          const isCurrent = currentTier === plan.key;
          const lower = currentTier ? levels[plan.key] < levels[currentTier] : false;
          return (
            <div
              key={plan.key}
              className={cn(
                "flex flex-col rounded-xl border bg-card p-6",
                plan.key === highlight ? "border-primary shadow-[0_0_0_1px_hsl(var(--primary))]" : "border-border"
              )}
            >
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">{plan.name}</h2>
                {isCurrent ? <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-semibold">Your plan</span> : null}
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{plan.blurb}</p>
              <p className="mt-5 text-4xl font-bold">${price.toLocaleString("en-US")}</p>
              <p className="text-xs text-muted-foreground">{yearly ? "per year" : "per month"}</p>
              <ul className="mt-5 flex-1 space-y-2 text-sm">
                {plan.features.map((f) => (
                  <li key={f} className="flex gap-2">
                    <span aria-hidden className="text-primary">✓</span>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <Button
                className="mt-6 w-full"
                variant={plan.key === highlight ? "default" : "secondary"}
                disabled={isCurrent}
                onClick={() => choose(plan.key)}
                isLoading={busy === plan.key}
                loadingText="Starting…"
              >
                {isCurrent ? "Current plan" : !signedIn ? "Get started" : lower ? `Switch to ${plan.name}` : `Upgrade to ${plan.name}`}
              </Button>
            </div>
          );
        })}
      </div>
    </>
  );
}
