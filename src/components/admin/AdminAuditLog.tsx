"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface AuditLogItem {
  id: string;
  action: string;
  entity_type: string;
  target: string;
  metadata: { tier?: string; durationDays?: number } | null;
  created_at: string;
  actor: { id: string; email: string; full_name: string | null } | null;
}

const ACTION: Record<string, string> = {
  grant_access: "granted a plan to",
  grant_tier_bulk: "granted a plan to",
  revoke_access: "revoked access for",
  revoke_access_bulk: "revoked access for",
  assign_admin_role: "made admin:",
  remove_admin_role: "removed admin from",
  publish_courses: "published",
  unpublish_courses: "unpublished"
};

export function AdminAuditLog() {
  const [page, setPage] = useState(1);
  const pageSize = 8;

  const { data, isLoading } = useQuery({
    queryKey: ["admin-audit-logs", page, pageSize],
    queryFn: async (): Promise<{ logs: AuditLogItem[]; pagination: { page: number; totalPages: number; total: number } }> => {
      const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
      const res = await fetch(`/api/admin/audit-logs?${params.toString()}`, { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to load audit logs");
      return (await res.json()) as { logs: AuditLogItem[]; pagination: { page: number; totalPages: number; total: number } };
    }
  });

  const logs = data?.logs ?? [];
  const pagination = data?.pagination;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Audit log</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="mb-3 text-sm text-muted-foreground">Every admin change, who made it and when.</p>
        <ul className="space-y-2">
          {isLoading ? <li className="text-sm text-muted-foreground">Loading…</li> : null}
          {!isLoading && logs.length === 0 ? <li className="text-sm text-muted-foreground">No admin changes yet.</li> : null}
          {logs.map((log) => {
            const tier = log.metadata?.tier ? ` (${log.metadata.tier})` : "";
            return (
              <li key={log.id} className="rounded-lg border border-border p-3 text-sm">
                <p>
                  <span className="font-medium">{log.actor?.full_name ?? log.actor?.email ?? "System"}</span>{" "}
                  {ACTION[log.action] ?? log.action.replace(/_/g, " ")} <span className="font-medium">{log.target}</span>
                  {tier}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {new Date(log.created_at).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })}
                </p>
              </li>
            );
          })}
        </ul>
        <div className="mt-4 flex items-center justify-between">
          <Button size="sm" variant="secondary" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
            Previous
          </Button>
          <p className="text-xs text-muted-foreground">
            Page {pagination?.page ?? page} of {pagination?.totalPages ?? 1}
          </p>
          <Button size="sm" variant="secondary" onClick={() => setPage((p) => p + 1)} disabled={Boolean(pagination && page >= pagination.totalPages)}>
            Next
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
