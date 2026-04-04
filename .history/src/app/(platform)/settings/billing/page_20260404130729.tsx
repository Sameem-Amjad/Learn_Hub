"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";

export default function BillingPage() {
  const [loading, setLoading] = useState(false);

  async function openPortal() {
    setLoading(true);
    const res = await fetch("/api/stripe/portal", { method: "POST" });
    const data = (await res.json()) as { url?: string };
    setLoading(false);

    if (data.url) {
      window.location.href = data.url;
    }
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10">
      <h1 className="text-3xl font-bold">Billing</h1>
      <p className="mt-2 text-muted-foreground">Manage subscription plans, invoices, and cancellations.</p>
      <Button className="mt-6" onClick={openPortal} disabled={loading}>
        {loading ? "Opening..." : "Open Stripe Billing Portal"}
      </Button>
    </div>
  );
}
