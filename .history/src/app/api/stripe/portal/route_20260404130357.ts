import { NextResponse } from "next/server";

import { stripe } from "@/lib/stripe/server";
import { createServiceRoleClient, createServerSupabaseClient } from "@/lib/supabase/server";

export async function POST() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const serviceClient = createServiceRoleClient();
  const { data: profile } = await serviceClient
    .from("users")
    .select("stripe_customer_id")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.stripe_customer_id) {
    return NextResponse.json({ error: "No billing profile" }, { status: 404 });
  }

  const portalSession = await stripe.billingPortal.sessions.create({
    customer: profile.stripe_customer_id,
    return_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings/billing`
  });

  return NextResponse.json({ url: portalSession.url });
}
