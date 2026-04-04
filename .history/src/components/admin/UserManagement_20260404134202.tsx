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

  const { data = [], refetch } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async (): Promise<AdminUser[]> => {
      const res = await fetch("/api/admin/users", { cache: "no-store" });
      if (!res.ok) {
        throw new Error("Failed to load users");
      }

      const payload = (await res.json()) as { users: AdminUser[] };
      return payload.users;
    }
  });

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
        <div className="space-y-3">
          {data.length === 0 ? <p className="text-sm text-muted-foreground">No users loaded yet.</p> : null}
          {data.map((user) => (
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
      </CardContent>
    </Card>
  );
}
