"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function NotesPanel({ lessonId }: { lessonId: string }) {
  const [note, setNote] = useState("");

  async function saveNote() {
    if (!note.trim()) {
      return;
    }

    await fetch("/api/notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lessonId, content: note })
    });

    setNote("");
  }

  return (
    <div className="rounded-xl border border-border p-4">
      <h3 className="mb-3 text-sm font-semibold">Private Notes</h3>
      <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Capture your insight..." />
      <Button className="mt-3" onClick={saveNote}>
        Save Note
      </Button>
    </div>
  );
}
