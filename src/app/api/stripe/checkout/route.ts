import { NextResponse } from "next/server";
import { z } from "zod";

import { DEMO_MODE } from "@/lib/demo";
import { ensureProfile } from "@/lib/server/profile";
import { activatePlan } from "@/lib/server/subscriptions";
import { stripe } from "@/lib/stripe/server";
import { createServiceRoleClient, getCurrentUser } from "@/lib/supabase/server";

const schema = z.object({
  tier: z.enum(["insider", "core", "pro"]),
  interval: z.enum(["month", "year"]).default("month")
});

/** Monthly price ids; yearly ones add _YEARLY (STRIPE_PRICE_CORE_YEARLY and so on). */
const PRICE_ENV = { insider: "STRIPE_PRICE_INSIDER", core: "STRIPE_PRICE_CORE", pro: "STRIPE_PRICE_PRO" } as const;

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const parsed = schema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json({ error: "Choose a plan." }, { status: 400 });
    }
    const { tier, interval } = parsed.data;
    await ensureProfile(user);

    // Demo mode: no Stripe account. The plan switches on directly, nothing is charged.
    if (DEMO_MODE) {
      await activatePlan([user.id], tier, { days: interval === "year" ? 365 : 30, source: "demo" });
      return NextResponse.json({ url: `/dashboard?plan=${tier}` });
    }

    const priceId = process.env[`${PRICE_ENV[tier]}${interval === "year" ? "_YEARLY" : ""}`];
    if (!priceId) {
      return NextResponse.json(
        { error: interval === "year" ? "Yearly billing isn't available for this plan yet. Choose monthly." : "This plan is not available yet." },
        { status: 400 }
      );
    }

    const serviceClient = createServiceRoleClient();
    const { data: profile } = await serviceClient.from("users").select("stripe_customer_id").eq("id", user.id).maybeSingle();
    let customerId = (profile as { stripe_customer_id: string | null } | null)?.stripe_customer_id ?? null;

    if (!customerId) {
      const customer = await stripe.customers.create({ email: user.email, metadata: { userId: user.id } });
      customerId = customer.id;
      await serviceClient.from("users").update({ stripe_customer_id: customerId }).eq("id", user.id);
    }

    const origin = process.env.NEXT_PUBLIC_APP_URL ?? new URL(req.url).origin;
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${origin}/settings/billing?success=true`,
      cancel_url: `${origin}/pricing?canceled=true`,
      metadata: { userId: user.id }
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Checkout creation failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
