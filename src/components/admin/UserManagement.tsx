"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { STATUS_LABEL, TIER_LABEL, shortDate } from "@/lib/utils/format";
import type { SubscriptionTier } from "@/types/subscription";

interface AdminUser {
  id: string;
  email: string;
  full_name: string | null;
  is_admin: boolean;
  editable: boolean;
  subscription: { tier: SubscriptionTier; status: string; current_period_end: string | null } | null;
}

type Page = { users: AdminUser[]; pagination: { page: number; totalPages: number; total: number } };

const TIERS: SubscriptionTier[] = ["insider", "core", "pro"];
const field = "h-10 rounded-md border border-border bg-background px-3 text-sm";

async function post(url: string, body: unknown) {
  const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const payload = (await res.json().catch(() => ({}))) as { error?: unknown };
  if (!res.ok) throw new Error(typeof payload.error === "string" ? payload.error : "The request failed");
}

export function UserManagement() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [tier, setTier] = useState<"" | SubscriptionTier>("");
  const [status, setStatus] = useState("");
  const [role, setRole] = useState<"" | "admin" | "member">("");
  const [grantTier, setGrantTier] = useState<Record<string, SubscriptionTier>>({});
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkTier, setBulkTier] = useState<SubscriptionTier>("core");
  const [busy, setBusy] = useState<string | null>(null);
  const pageSize = 10;

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["admin-users", page, pageSize, search, tier, status, role],
    queryFn: async (): Promise<Page> => {
      const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
      if (search) params.set("search", search);
      if (tier) params.set("tier", tier);
      if (status) params.set("status", status);
      if (role) params.set("role", role);
      const res = await fetch(`/api/admin/users?${params.toString()}`, { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to load users");
      return (await res.json()) as Page;
    }
  });

  const users = data?.users ?? [];
  const pagination = data?.pagination;
  const refresh = () => Promise.all([
    queryClient.invalidateQueries({ queryKey: ["admin-users"] }),
    queryClient.invalidateQueries({ queryKey: ["admin-analytics"] }),
    queryClient.invalidateQueries({ queryKey: ["admin-audit-logs"] })
  ]);

  async function run(key: string, fn: () => Promise<void>, done: string) {
    setBusy(key);
    try {
      await fn();
      toast.success(done);
      await refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "The request failed");
    } finally {
      setBusy(null);
    }
  }

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  const editableOnPage = users.filter((u) => u.editable);
  const allSelected = editableOnPage.length > 0 && editableOnPage.every((u) => selected.has(u.id));
  const resetPage = <T,>(set: (v: T) => void) => (v: T) => { setPage(1); setSelected(new Set()); set(v); };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Users and plans</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          <input className={field} aria-label="Search users" placeholder="Search email or name" value={search} onChange={(e) => resetPage(setSearch)(e.target.value)} />
          <select className={field} aria-label="Filter by tier" value={tier} onChange={(e) => resetPage(setTier)(e.target.value as "" | SubscriptionTier)}>
            <option value="">All tiers</option>
            {TIERS.map((t) => <option key={t} value={t}>{TIER_LABEL[t]}</option>)}
          </select>
          <select className={field} aria-label="Filter by status" value={status} onChange={(e) => resetPage(setStatus)(e.target.value)}>
            <option value="">All statuses</option>
            {Object.entries(STATUS_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <select className={field} aria-label="Filter by role" value={role} onChange={(e) => resetPage(setRole)(e.target.value as "" | "admin" | "member")}>
            <option value="">All roles</option>
            <option value="admin">Admins</option>
            <option value="member">Members</option>
          </select>
        </div>

        <div className="mb-3 flex flex-wrap items-center gap-2 rounded-lg border border-border bg-muted/40 p-3 text-sm">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={allSelected}
              onChange={() => setSelected(allSelected ? new Set() : new Set(editableOnPage.map((u) => u.id)))}
              aria-label="Select every user on this page"
            />
            <span>{selected.size ? `${selected.size} selected` : "Select users for a bulk change"}</span>
          </label>
          <span className="flex-1" />
          <select className={`${field} h-9`} aria-label="Tier to grant to the selected users" value={bulkTier} onChange={(e) => setBulkTier(e.target.value as SubscriptionTier)}>
            {TIERS.map((t) => <option key={t} value={t}>{TIER_LABEL[t]}</option>)}
          </select>
          <Button
            size="sm"
            disabled={!selected.size}
            isLoading={busy === "bulk-grant"}
            loadingText="Granting…"
            onClick={() => run("bulk-grant", () => post("/api/admin/bulk-actions", { action: "grant_tier", ids: [...selected], tier: bulkTier }), `${TIER_LABEL[bulkTier]} granted to ${selected.size} users.`).then(() => setSelected(new Set()))}
          >
            Grant to selected
          </Button>
          <Button
            size="sm"
            variant="secondary"
            disabled={!selected.size}
            isLoading={busy === "bulk-revoke"}
            loadingText="Revoking…"
            onClick={() => run("bulk-revoke", () => post("/api/admin/bulk-actions", { action: "revoke_access", ids: [...selected] }), "Access revoked.").then(() => setSelected(new Set()))}
          >
            Revoke selected
          </Button>
        </div>

        <p className="mb-2 text-xs text-muted-foreground" aria-live="polite">
          {isLoading || isFetching ? "Loading users…" : pagination ? `${pagination.total} users` : ""}
        </p>
        <ul className="space-y-2">
          {!isLoading && users.length === 0 ? <li className="text-sm text-muted-foreground">No users match these filters.</li> : null}
          {users.map((user) => {
            const sub = user.subscription;
            const active = sub && (sub.status === "active" || sub.status === "trialing");
            const chosen = grantTier[user.id] ?? "pro";
            return (
              <li key={user.id} className="flex flex-col gap-3 rounded-lg border border-border p-3 md:flex-row md:items-center">
                <div className="flex min-w-0 flex-1 items-start gap-3">
                  <input
                    type="checkbox"
                    className="mt-1"
                    checked={selected.has(user.id)}
                    disabled={!user.editable}
                    onChange={() => toggle(user.id)}
                    aria-label={`Select ${user.full_name ?? user.email}`}
                  />
                  <div className="min-w-0">
                    <p className="font-medium">
                      {user.full_name ?? user.email} {user.is_admin ? <Badge className="ml-1 bg-primary/20 text-foreground">Admin</Badge> : null}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                    <p className="text-xs text-muted-foreground">
                      {sub
                        ? `${TIER_LABEL[sub.tier]} · ${STATUS_LABEL[sub.status] ?? sub.status}${sub.current_period_end ? ` · ${active ? "renews" : "ended"} ${shortDate(sub.current_period_end)}` : ""}`
                        : "No plan"}
                    </p>
                  </div>
                </div>
                {user.editable ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <select
                      className={`${field} h-9`}
                      aria-label={`Tier to grant ${user.full_name ?? user.email}`}
                      value={chosen}
                      onChange={(e) => setGrantTier((m) => ({ ...m, [user.id]: e.target.value as SubscriptionTier }))}
                    >
                      {TIERS.map((t) => <option key={t} value={t}>{TIER_LABEL[t]}</option>)}
                    </select>
                    <Button
                      size="sm"
                      isLoading={busy === `grant-${user.id}`}
                      loadingText="Granting…"
                      onClick={() => run(`grant-${user.id}`, () => post("/api/admin/grant-access", { userId: user.id, tier: chosen }), `${TIER_LABEL[chosen]} granted for 30 days.`)}
                    >
                      Grant
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      disabled={!active}
                      isLoading={busy === `revoke-${user.id}`}
                      loadingText="Revoking…"
                      onClick={() => run(`revoke-${user.id}`, () => post("/api/admin/revoke-access", { userId: user.id }), "Access revoked.")}
                    >
                      Revoke
                    </Button>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground md:max-w-[14rem] md:text-right">Shared demo login or visitor account: read-only for the demo admin.</p>
                )}
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
