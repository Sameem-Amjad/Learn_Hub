"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";

export function CourseEditor() {
  const [courseIds, setCourseIds] = useState("");
  const [busyAction, setBusyAction] = useState<"publish_courses" | "unpublish_courses" | null>(null);

  async function bulkPublish(action: "publish_courses" | "unpublish_courses") {
    const ids = courseIds
      .split(",")
      .map((id) => id.trim())
      .filter(Boolean);

    if (ids.length === 0) {
      return;
    }

    setBusyAction(action);
    await fetch("/api/admin/bulk-actions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, ids })
    });
    setBusyAction(null);
  }

  return (
    <div className="rounded-xl border border-border p-4">
      <h2 className="font-semibold">Course Editor</h2>
      <p className="mt-2 text-sm text-muted-foreground">Create, reorder, and publish courses and modules.</p>
      <p className="mt-3 text-xs text-muted-foreground">Paste course UUIDs (comma-separated) for bulk publish actions.</p>
      <textarea
        className="mt-2 min-h-24 w-full rounded-md border border-border bg-transparent p-2 text-sm"
        value={courseIds}
        onChange={(e) => setCourseIds(e.target.value)}
      />
      <div className="mt-3 flex gap-2">
        <Button
          size="sm"
          onClick={() => bulkPublish("publish_courses")}
          isLoading={busyAction === "publish_courses"}
          loadingText="Publishing..."
        >
          Bulk Publish
        </Button>
        <Button
          size="sm"
          variant="secondary"
          onClick={() => bulkPublish("unpublish_courses")}
          isLoading={busyAction === "unpublish_courses"}
          loadingText="Unpublishing..."
        >
          Bulk Unpublish
        </Button>
      </div>
    </div>
  );
}
