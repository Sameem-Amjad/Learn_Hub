import Link from "next/link";
import { redirect } from "next/navigation";

import { PortalButton } from "@/components/billing/PortalButton";
import { Badge } from "@/components/ui/badge";
import { DEMO_MODE } from "@/lib/demo";
import { getSubscription } from "@/lib/server/learning-data";
import { getCurrentUser } from "@/lib/supabase/server";
import { STATUS_LABEL, TIER_LABEL, shortDate } from "@/lib/utils/format";

export default async function BillingPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const sub = await getSubscription(user.id);
  const active = sub && (sub.status === "active" || sub.status === "trialing");

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10">
      <h1 className="text-3xl font-bold">Billing</h1>
      <p className="mt-2 text-muted-foreground">Your plan, its renewal date, and where to change it.</p>

      <section className="mt-6 rounded-xl border border-border p-5">
        {sub ? (
          <>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-semibold">{TIER_LABEL[sub.tier]}</span>
              <Badge className={active ? "" : "bg-muted text-muted-foreground"}>{STATUS_LABEL[sub.status] ?? sub.status}</Badge>
            </div>
            <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-[160px_1fr]">
              <dt className="text-muted-foreground">Current period</dt>
              <dd>{shortDate(sub.current_period_start)} to {shortDate(sub.current_period_end)}</dd>
              <dt className="text-muted-foreground">{active ? "Renews" : "Ended"}</dt>
              <dd>{sub.cancel_at_period_end && active ? `Cancels on ${shortDate(sub.current_period_end)}` : shortDate(sub.current_period_end)}</dd>
            </dl>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">You don&apos;t have a plan yet. Preview lessons are free.</p>
        )}
        <div className="mt-5 flex flex-wrap gap-3">
          <Link href="/pricing" className="inline-flex h-10 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:brightness-110">
            {sub ? "Change plan" : "Choose a plan"}
          </Link>
          {DEMO_MODE ? null : <PortalButton />}
        </div>
      </section>

      {DEMO_MODE ? (
        <p className="mt-4 rounded-lg border border-border bg-muted/40 p-4 text-sm text-muted-foreground">
          Demo mode: no Stripe account is connected, so plans switch on without a card and nothing is charged. In
          production, checkout, invoices and cancellation run through Stripe, and Stripe&apos;s webhooks keep this page in step.
        </p>
      ) : null}
    </div>
  );
}
