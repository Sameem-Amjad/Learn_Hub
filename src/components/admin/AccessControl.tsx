"use client";

import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

export function AccessControl() {
  const [userIds, setUserIds] = useState("");
  const [busyAction, setBusyAction] = useState<"grant" | "revoke" | null>(null);

  async function bulkGrant() {
    const ids = userIds
      .split(",")
      .map((id) => id.trim())
      .filter(Boolean);

    if (ids.length === 0) {
      toast.error("Please provide at least one user ID.");
      return;
    }

    try {
      setBusyAction("grant");
      const res = await fetch("/api/admin/bulk-actions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "grant_tier", ids, tier: "core" })
      });

      if (!res.ok) {
        const payload = (await res.json()) as { error?: string };
        toast.error(payload.error ?? "Bulk grant failed.");
        return;
      }

      toast.success("Bulk grant completed.");
    } catch {
      toast.error("Bulk grant failed.");
    } finally {
      setBusyAction(null);
    }
  }

  async function bulkRevoke() {
    const ids = userIds
      .split(",")
      .map((id) => id.trim())
      .filter(Boolean);

    if (ids.length === 0) {
      toast.error("Please provide at least one user ID.");
      return;
    }

    try {
      setBusyAction("revoke");
      const res = await fetch("/api/admin/bulk-actions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "revoke_access", ids })
      });

      if (!res.ok) {
        const payload = (await res.json()) as { error?: string };
        toast.error(payload.error ?? "Bulk revoke failed.");
        return;
      }

      toast.success("Bulk revoke completed.");
    } catch {
      toast.error("Bulk revoke failed.");
    } finally {
      setBusyAction(null);
    }
  }

  return (
    <div className="rounded-xl border border-border p-4">
      <h2 className="font-semibold">Access Control</h2>
      <p className="mt-2 text-sm text-muted-foreground">Grant and revoke tier access overrides for users.</p>
      <p className="mt-3 text-xs text-muted-foreground">Paste user UUIDs (comma-separated) for bulk actions.</p>
      <textarea
        className="mt-2 min-h-24 w-full rounded-md border border-border bg-transparent p-2 text-sm"
        value={userIds}
        onChange={(e) => setUserIds(e.target.value)}
      />
      <div className="mt-3 flex gap-2">
        <Button size="sm" onClick={bulkGrant} isLoading={busyAction === "grant"} loadingText="Granting...">
          Grant Core (Bulk)
        </Button>
        <Button size="sm" variant="secondary" onClick={bulkRevoke} isLoading={busyAction === "revoke"} loadingText="Revoking...">
          Revoke (Bulk)
        </Button>
      </div>
    </div>
  );
}
