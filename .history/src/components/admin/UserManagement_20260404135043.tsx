"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface AdminUser {
  id: string;
  email: string;
  full_name: string | null;
  subscription: {
    tier: "insider" | "core" | "pro";
    status: string;
    current_period_end: string | null;
  } | null;
}

export function UserManagement() {
  const [busyUserId, setBusyUserId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [tier, setTier] = useState<"" | "insider" | "core" | "pro">("");
  const [status, setStatus] = useState<"" | "active" | "canceled" | "past_due" | "incomplete" | "trialing">("");

  const pageSize = 10;

  const { data, refetch } = useQuery({
    queryKey: ["admin-users", page, pageSize, search, tier, status],
    queryFn: async (): Promise<{ users: AdminUser[]; pagination: { page: number; totalPages: number; total: number } }> => {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize)
      });

      if (search) {
        params.set("search", search);
      }
      if (tier) {
        params.set("tier", tier);
      }
      if (status) {
        params.set("status", status);
      }

      const res = await fetch(`/api/admin/users?${params.toString()}`, { cache: "no-store" });
      if (!res.ok) {
        throw new Error("Failed to load users");
      }

      return (await res.json()) as { users: AdminUser[]; pagination: { page: number; totalPages: number; total: number } };
    }
  });

  const users = data?.users ?? [];
  const pagination = data?.pagination;

  async function grantAccess(userId: string, tier: "insider" | "core" | "pro") {
    setBusyUserId(userId);
    await fetch("/api/admin/grant-access", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, tier })
    });
    await refetch();
    setBusyUserId(null);
  }

  async function revokeAccess(userId: string) {
    setBusyUserId(userId);
    await fetch("/api/admin/revoke-access", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId })
    });
    await refetch();
    setBusyUserId(null);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>User Management</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-4 grid gap-2 md:grid-cols-4">
          <input
            className="h-10 rounded-md border border-border bg-transparent px-3 text-sm"
            placeholder="Search email or name"
            value={search}
            onChange={(e) => {
              setPage(1);
              setSearch(e.target.value);
            }}
          />
          <select
            className="h-10 rounded-md border border-border bg-transparent px-3 text-sm"
            value={tier}
            onChange={(e) => {
              setPage(1);
              setTier(e.target.value as "" | "insider" | "core" | "pro");
            }}
          >
            <option value="">All tiers</option>
            <option value="insider">Insider</option>
            <option value="core">Core</option>
            <option value="pro">Pro</option>
          </select>
          <select
            className="h-10 rounded-md border border-border bg-transparent px-3 text-sm"
            value={status}
            onChange={(e) => {
              setPage(1);
              setStatus(e.target.value as "" | "active" | "canceled" | "past_due" | "incomplete" | "trialing");
            }}
          >
            <option value="">All statuses</option>
            <option value="active">Active</option>
            <option value="trialing">Trialing</option>
            <option value="past_due">Past Due</option>
            <option value="incomplete">Incomplete</option>
            <option value="canceled">Canceled</option>
          </select>
          <div className="flex items-center justify-end text-xs text-muted-foreground">
            {pagination ? `Total: ${pagination.total}` : ""}
          </div>
        </div>
        <div className="space-y-3">
          {users.length === 0 ? <p className="text-sm text-muted-foreground">No users loaded yet.</p> : null}
          {users.map((user) => (
            <div key={user.id} className="flex items-center justify-between rounded border border-border p-3">
              <div>
                <p className="font-medium">{user.full_name ?? user.email}</p>
                <p className="text-xs text-muted-foreground">{user.email}</p>
                <p className="text-xs text-muted-foreground">{user.id}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge>{user.subscription?.tier ?? "none"}</Badge>
                <Badge>{user.subscription?.status ?? "inactive"}</Badge>
                <Button size="sm" onClick={() => grantAccess(user.id, "pro")} disabled={busyUserId === user.id}>
                  Grant Pro
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => revokeAccess(user.id)}
                  disabled={busyUserId === user.id}
                >
                  Revoke
                </Button>
              </div>
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
