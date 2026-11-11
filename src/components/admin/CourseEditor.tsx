"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TIER_LABEL } from "@/lib/utils/format";
import type { SubscriptionTier } from "@/types/subscription";

type Course = {
  id: string;
  title: string;
  slug: string;
  required_tier: SubscriptionTier;
  is_published: boolean;
  module_count: number;
  lesson_count: number;
};

export function CourseEditor() {
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState<"publish_courses" | "unpublish_courses" | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-courses"],
    queryFn: async (): Promise<{ courses: Course[] }> => {
      const res = await fetch("/api/admin/courses", { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to load courses");
      return (await res.json()) as { courses: Course[] };
    }
  });
  const courses = data?.courses ?? [];

  async function bulk(action: "publish_courses" | "unpublish_courses") {
    try {
      setBusy(action);
      const res = await fetch("/api/admin/bulk-actions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ids: [...selected] })
      });
      const payload = (await res.json().catch(() => ({}))) as { error?: unknown; affected?: number };
      if (!res.ok) {
        toast.error(typeof payload.error === "string" ? payload.error : "The course change failed.");
        return;
      }
      toast.success(`${payload.affected ?? selected.size} ${action === "publish_courses" ? "published" : "unpublished"}.`);
      setSelected(new Set());
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["admin-courses"] }),
        queryClient.invalidateQueries({ queryKey: ["admin-analytics"] }),
        queryClient.invalidateQueries({ queryKey: ["admin-audit-logs"] })
      ]);
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Courses</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="mb-3 text-sm text-muted-foreground">Drafts stay hidden from learners until they are published.</p>
        {isLoading ? <p className="text-sm text-muted-foreground">Loading courses…</p> : null}
        <ul className="space-y-2">
          {courses.map((c) => (
            <li key={c.id}>
              <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-border p-3 hover:bg-muted/40">
                <input type="checkbox" checked={selected.has(c.id)} onChange={() => toggle(c.id)} />
                <span className="flex-1">
                  <span className="block font-medium">{c.title}</span>
                  <span className="text-xs text-muted-foreground">
                    {c.module_count} modules · {c.lesson_count} lessons · {TIER_LABEL[c.required_tier]} plan
                  </span>
                </span>
                <Badge className={c.is_published ? "" : "bg-muted text-muted-foreground"}>{c.is_published ? "Published" : "Draft"}</Badge>
              </label>
            </li>
          ))}
        </ul>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button size="sm" disabled={!selected.size} onClick={() => bulk("publish_courses")} isLoading={busy === "publish_courses"} loadingText="Publishing…">
            Publish selected
          </Button>
          <Button size="sm" variant="secondary" disabled={!selected.size} onClick={() => bulk("unpublish_courses")} isLoading={busy === "unpublish_courses"} loadingText="Unpublishing…">
            Unpublish selected
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
