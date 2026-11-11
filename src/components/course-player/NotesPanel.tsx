"use client";

import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { clock } from "@/lib/utils/format";

export type Note = { id: string; content: string; timestamp: number | null; created_at: string };

export function NotesPanel({
  lessonId,
  initialNotes,
  currentTime,
  onSeek
}: {
  lessonId: string;
  initialNotes: Note[];
  /** Reads the video's position when the note is saved (null for reading lessons). */
  currentTime: () => number | null;
  onSeek?: (seconds: number) => void;
}) {
  const [notes, setNotes] = useState<Note[]>(initialNotes);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  async function saveNote(e: React.FormEvent) {
    e.preventDefault();
    if (!note.trim()) {
      toast.error("Write a note before saving.");
      return;
    }

    const at = currentTime();
    try {
      setSaving(true);
      const res = await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lessonId, content: note.trim(), ...(at !== null ? { timestamp: Math.floor(at) } : {}) })
      });
      const payload = (await res.json()) as { note?: Note; error?: string };

      if (!res.ok || !payload.note) {
        toast.error(payload.error ?? "Failed to save note.");
        return;
      }

      setNotes((prev) => [payload.note!, ...prev]);
      setNote("");
      toast.success("Note saved.");
    } catch {
      toast.error("Failed to save note.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="rounded-xl border border-border p-4" aria-labelledby="notes-heading">
      <h2 id="notes-heading" className="mb-1 text-sm font-semibold">Private notes</h2>
      <p className="mb-3 text-xs text-muted-foreground">Only you can see these. Notes taken during a video keep the time they were written.</p>
      <form onSubmit={saveNote} className="space-y-3">
        <label htmlFor="note-input" className="sr-only">New note</label>
        <textarea
          id="note-input"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Capture an idea from this lesson…"
          rows={2}
          maxLength={2000}
          className="w-full rounded-md border border-border bg-transparent p-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary"
        />
        <Button type="submit" size="sm" isLoading={saving} loadingText="Saving note…">
          Save note
        </Button>
      </form>
      {notes.length ? (
        <ul className="mt-4 space-y-2" aria-label="Your notes">
          {notes.map((n) => (
            <li key={n.id} className="flex gap-3 rounded-md bg-muted/50 p-3 text-sm">
              {n.timestamp !== null ? (
                onSeek ? (
                  <button
                    type="button"
                    onClick={() => onSeek(n.timestamp!)}
                    className="h-fit shrink-0 rounded bg-primary/15 px-1.5 py-0.5 font-mono text-xs text-primary hover:bg-primary/25"
                    aria-label={`Play from ${clock(n.timestamp)}`}
                  >
                    {clock(n.timestamp)}
                  </button>
                ) : (
                  <span className="h-fit shrink-0 rounded bg-muted px-1.5 py-0.5 font-mono text-xs">{clock(n.timestamp)}</span>
                )
              ) : null}
              <p className="whitespace-pre-wrap">{n.content}</p>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
