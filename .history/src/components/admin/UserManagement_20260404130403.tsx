"use client";

import { useQuery } from "@tanstack/react-query";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function UserManagement() {
  const { data = [] } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      return [] as Array<{ id: string; email: string; tier: string; status: string }>;
    }
  });

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
                <p className="font-medium">{user.email}</p>
                <p className="text-xs text-muted-foreground">{user.id}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge>{user.tier}</Badge>
                <Badge>{user.status}</Badge>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
