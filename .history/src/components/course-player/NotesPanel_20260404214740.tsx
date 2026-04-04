"use client";

import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function NotesPanel({ lessonId }: { lessonId: string }) {
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  async function saveNote() {
    if (!note.trim()) {
      toast.error("Write a note before saving.");
      return;
    }

    try {
      setSaving(true);
      const res = await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lessonId, content: note })
      });

      if (!res.ok) {
        const payload = (await res.json()) as { error?: string };
        toast.error(payload.error ?? "Failed to save note.");
        return;
      }

      toast.success("Note saved.");
      setNote("");
    } catch {
      toast.error("Failed to save note.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-xl border border-border p-4">
      <h3 className="mb-3 text-sm font-semibold">Private Notes</h3>
      <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Capture your insight..." />
      <Button className="mt-3" onClick={saveNote} isLoading={saving} loadingText="Saving note...">
        Save Note
      </Button>
    </div>
  );
}
