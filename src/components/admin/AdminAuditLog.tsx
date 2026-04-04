"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface AuditLogItem {
  id: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  created_at: string;
  actor: { id: string; email: string; full_name: string | null } | null;
}

export function AdminAuditLog() {
  const [page, setPage] = useState(1);
  const pageSize = 8;

  const { data } = useQuery({
    queryKey: ["admin-audit-logs", page, pageSize],
    queryFn: async (): Promise<{ logs: AuditLogItem[]; pagination: { page: number; totalPages: number; total: number } }> => {
      const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
      const res = await fetch(`/api/admin/audit-logs?${params.toString()}`, { cache: "no-store" });
      if (!res.ok) {
        throw new Error("Failed to load audit logs");
      }
      return (await res.json()) as { logs: AuditLogItem[]; pagination: { page: number; totalPages: number; total: number } };
    }
  });

  const logs = data?.logs ?? [];
  const pagination = data?.pagination;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Admin Audit Log</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {logs.length === 0 ? <p className="text-sm text-muted-foreground">No audit logs yet.</p> : null}
          {logs.map((log) => (
            <div key={log.id} className="rounded border border-border p-3 text-sm">
              <p className="font-medium">{log.action}</p>
              <p className="text-xs text-muted-foreground">
                {log.entity_type} {log.entity_id ?? "-"}
              </p>
              <p className="text-xs text-muted-foreground">
                By: {log.actor?.full_name ?? log.actor?.email ?? "system"} | {new Date(log.created_at).toLocaleString()}
              </p>
            </div>
          ))}
        </div>
        <div className="mt-4 flex items-center justify-between">
          <Button size="sm" variant="secondary" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
            Previous
          </Button>
          <p className="text-xs text-muted-foreground">
            Page {pagination?.page ?? page} of {pagination?.totalPages ?? 1}
          </p>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => setPage((p) => p + 1)}
            disabled={Boolean(pagination && page >= pagination.totalPages)}
          >
            Next
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
