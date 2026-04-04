"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface RoleUser {
  id: string;
  email: string;
  full_name: string | null;
  is_admin: boolean;
}

export function AdminRolesManagement() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [busyUserId, setBusyUserId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const pageSize = 10;

  const { data, refetch } = useQuery({
    queryKey: ["admin-roles", page, pageSize, search],
    queryFn: async (): Promise<{ users: RoleUser[]; pagination: { page: number; totalPages: number; total: number } }> => {
      const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
      if (search.trim()) {
        params.set("search", search.trim());
      }

      const res = await fetch(`/api/admin/roles?${params.toString()}`, { cache: "no-store" });
      if (!res.ok) {
        throw new Error("Failed to load role users");
      }
      return (await res.json()) as { users: RoleUser[]; pagination: { page: number; totalPages: number; total: number } };
    }
  });

  const users = data?.users ?? [];
  const pagination = data?.pagination;

  async function assignAdmin(userId: string) {
    setBusyUserId(userId);
    setMessage(null);
    const res = await fetch("/api/admin/roles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, role: "admin" })
    });
    if (!res.ok) {
      const payload = (await res.json()) as { error?: string };
      setMessage(payload.error ?? "Failed to assign admin role");
      setBusyUserId(null);
      return;
    }
    setMessage("Admin role assigned.");
    await refetch();
    setBusyUserId(null);
  }

  async function removeAdmin(userId: string) {
    setBusyUserId(userId);
    setMessage(null);
    const res = await fetch("/api/admin/roles", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, role: "admin" })
    });
    if (!res.ok) {
      const payload = (await res.json()) as { error?: string };
      setMessage(payload.error ?? "Failed to remove admin role");
      setBusyUserId(null);
      return;
    }
    setMessage("Admin role removed.");
    await refetch();
    setBusyUserId(null);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Admin Roles Management</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-4 flex items-center gap-2">
          <input
            className="h-10 flex-1 rounded-md border border-border bg-transparent px-3 text-sm"
            placeholder="Search by email or name"
            value={search}
            onChange={(e) => {
              setPage(1);
              setSearch(e.target.value);
            }}
          />
          <span className="text-xs text-muted-foreground">Total: {pagination?.total ?? 0}</span>
        </div>
        {message ? <p className="mb-3 text-sm text-muted-foreground">{message}</p> : null}

        <div className="space-y-3">
          {users.length === 0 ? <p className="text-sm text-muted-foreground">No users found.</p> : null}
          {users.map((user) => (
            <div key={user.id} className="flex items-center justify-between rounded border border-border p-3">
              <div>
                <p className="font-medium">{user.full_name ?? user.email}</p>
                <p className="text-xs text-muted-foreground">{user.email}</p>
                <p className="text-xs text-muted-foreground">{user.id}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-xs ${user.is_admin ? "text-primary" : "text-muted-foreground"}`}>
                  {user.is_admin ? "Admin" : "Member"}
                </span>
                {user.is_admin ? (
                  <Button size="sm" variant="secondary" onClick={() => removeAdmin(user.id)} disabled={busyUserId === user.id}>
                    Remove Admin
                  </Button>
                ) : (
                  <Button size="sm" onClick={() => assignAdmin(user.id)} disabled={busyUserId === user.id}>
                    Make Admin
                  </Button>
                )}
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
