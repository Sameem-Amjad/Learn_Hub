import type Stripe from "stripe";
import { headers } from "next/headers";

import { stripe } from "@/lib/stripe/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { getTierFromPriceId } from "@/lib/utils/tier-comparison";

export const runtime = "nodejs";

async function getUserIdFromCustomer(customerId: string) {
  const supabase = createServiceRoleClient();
  const { data } = await supabase
    .from("users")
    .select("id")
    .eq("stripe_customer_id", customerId)
    .maybeSingle();

  return data?.id ?? null;
}

async function syncSubscription(subscription: Stripe.Subscription) {
  const sub = subscription as Stripe.Subscription & {
    current_period_start?: number;
    current_period_end?: number;
  };

  const supabase = createServiceRoleClient();
  const customerId = sub.customer as string;
  const userId = await getUserIdFromCustomer(customerId);

  if (!userId) {
    throw new Error("Unable to map Stripe customer to user");
  }

  const priceId = sub.items.data[0]?.price.id;
  if (!priceId) {
    throw new Error("Missing subscription price");
  }

  const tier = getTierFromPriceId(priceId);
  if (!tier) {
    throw new Error("Unknown price mapping");
  }

  const payload = {
    user_id: userId,
    stripe_subscription_id: subscription.id,
    stripe_price_id: priceId,
    tier,
    status: sub.status,
    current_period_start: sub.current_period_start
      ? new Date(sub.current_period_start * 1000).toISOString()
      : null,
    current_period_end: sub.current_period_end ? new Date(sub.current_period_end * 1000).toISOString() : null,
    cancel_at_period_end: sub.cancel_at_period_end,
    updated_at: new Date().toISOString()
  };

  const { error } = await supabase.from("subscriptions").upsert(payload, {
    onConflict: "stripe_subscription_id"
  });

  if (error) {
    throw error;
  }
}

async function markPastDue(invoice: Stripe.Invoice) {
  const subscriptionId = typeof invoice.subscription === "string" ? invoice.subscription : invoice.subscription?.id;
  if (!subscriptionId) {
    return;
  }

  const supabase = createServiceRoleClient();
  await supabase
    .from("subscriptions")
    .update({ status: "past_due", updated_at: new Date().toISOString() })
    .eq("stripe_subscription_id", subscriptionId);
}

export async function POST(req: Request) {
  const rawBody = await req.text();
  const signature = (await headers()).get("stripe-signature");

  if (!signature || !process.env.STRIPE_WEBHOOK_SECRET) {
    return new Response("Missing webhook signature", { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, process.env.STRIPE_WEBHOOK_SECRET);
  } catch {
    return new Response("Webhook Error", { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.subscription && typeof session.subscription === "string") {
          const subscription = await stripe.subscriptions.retrieve(session.subscription);
          await syncSubscription(subscription);
        }
        break;
      }
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        await syncSubscription(event.data.object as Stripe.Subscription);
        break;
      }
      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        if (typeof invoice.subscription === "string") {
          const subscription = await stripe.subscriptions.retrieve(invoice.subscription);
          await syncSubscription(subscription);
        }
        break;
      }
      case "invoice.payment_failed": {
        await markPastDue(event.data.object as Stripe.Invoice);
        break;
      }
      default:
        break;
    }
  } catch {
    return new Response("Webhook processing failed", { status: 500 });
  }

  return new Response(JSON.stringify({ received: true }), { status: 200 });
}
