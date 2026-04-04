"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";

export function AccessControl() {
  const [userIds, setUserIds] = useState("");

  async function bulkGrant() {
    const ids = userIds
      .split(",")
      .map((id) => id.trim())
      .filter(Boolean);

    if (ids.length === 0) {
      return;
    }

    await fetch("/api/admin/bulk-actions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "grant_tier", ids, tier: "core" })
    });
  }

  async function bulkRevoke() {
    const ids = userIds
      .split(",")
      .map((id) => id.trim())
      .filter(Boolean);

    if (ids.length === 0) {
      return;
    }

    await fetch("/api/admin/bulk-actions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "revoke_access", ids })
    });
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
        <Button size="sm" onClick={bulkGrant}>
          Grant Core (Bulk)
        </Button>
        <Button size="sm" variant="secondary" onClick={bulkRevoke}>
          Revoke (Bulk)
        </Button>
      </div>
    </div>
  );
}
