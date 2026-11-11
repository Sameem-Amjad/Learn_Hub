"use client";

import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

export function PortalButton() {
  const [loading, setLoading] = useState(false);

  async function openPortal() {
    try {
      setLoading(true);
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !data.url) {
        toast.error(data.error ?? "Failed to open billing portal.");
        return;
      }
      window.location.href = data.url;
    } catch {
      toast.error("Failed to open billing portal.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button variant="secondary" onClick={openPortal} isLoading={loading} loadingText="Opening…">
      Invoices and cancellation
    </Button>
  );
}
