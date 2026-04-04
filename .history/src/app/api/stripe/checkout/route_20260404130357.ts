import { NextResponse } from "next/server";
import { z } from "zod";

import { stripe } from "@/lib/stripe/server";
import { createServiceRoleClient, createServerSupabaseClient } from "@/lib/supabase/server";

const schema = z.object({
  priceId: z.string().min(1)
});

export async function POST(req: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = schema.parse(await req.json());
    const serviceClient = createServiceRoleClient();

    const { data: profile } = await serviceClient
      .from("users")
      .select("stripe_customer_id,email")
      .eq("id", user.id)
      .maybeSingle();

    let customerId = profile?.stripe_customer_id ?? null;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { userId: user.id }
      });
      customerId = customer.id;

      await serviceClient
        .from("users")
        .upsert({ id: user.id, email: user.email ?? "", stripe_customer_id: customerId }, { onConflict: "id" });
    }

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      line_items: [{ price: body.priceId, quantity: 1 }],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings/billing?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing?canceled=true`,
      metadata: { userId: user.id }
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Checkout creation failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
