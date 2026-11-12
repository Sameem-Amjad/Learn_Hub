"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { LessonContent } from "@/components/course-player/LessonContent";
import { NotesPanel, type Note } from "@/components/course-player/NotesPanel";
import { ProgressTracker } from "@/components/course-player/ProgressTracker";
import { Button } from "@/components/ui/button";

type Lesson = { id: string; title: string; content: string | null; duration: number | null; is_preview: boolean };

/** Share of the video that counts as finished. */
const DONE_AT = 0.9;
/** Save the position at most this often while playing. */
const SAVE_EVERY_S = 10;

export function CoursePlayer({
  lesson,
  videoSrc,
  initialPosition,
  initiallyCompleted,
  initialNotes,
  previewOnly
}: {
  lesson: Lesson;
  videoSrc: string | null;
  initialPosition: number;
  initiallyCompleted: boolean;
  initialNotes: Note[];
  previewOnly: boolean;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const lastSaved = useRef(initialPosition);
  // Set the moment completion is first sent, so repeated time updates past 90%
  // (and the ended event) don't send it again.
  const completing = useRef(initiallyCompleted);
  const [completed, setCompleted] = useState(initiallyCompleted);
  const [percent, setPercent] = useState(initiallyCompleted ? 100 : 0);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  const save = useCallback(
    async (position: number, markComplete = false) => {
      setSaving(true);
      try {
        const res = await fetch("/api/progress", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ lessonId: lesson.id, lastPosition: Math.floor(position), completed: markComplete })
        });
        if (!res.ok) throw new Error("save failed");
        lastSaved.current = position;
        setSavedAt(Math.floor(position));
        if (markComplete && !completed) {
          setCompleted(true);
          setPercent(100);
          toast.success("Lesson completed.");
        }
      } catch {
        if (markComplete) completing.current = completed;
        toast.error("Couldn't save your progress. Check your connection.");
      } finally {
        setSaving(false);
      }
    },
    [lesson.id, completed]
  );

  // Resume where the learner stopped (unless that was the very end).
  function onLoadedMetadata() {
    const v = videoRef.current;
    if (!v) return;
    if (initialPosition > 5 && initialPosition < v.duration - 5) v.currentTime = initialPosition;
    if (!completed) setPercent((v.currentTime / v.duration) * 100);
  }

  function onTimeUpdate() {
    const v = videoRef.current;
    if (!v || !v.duration) return;
    if (!completed) setPercent((v.currentTime / v.duration) * 100);
    if (!completing.current && v.currentTime / v.duration >= DONE_AT) {
      completing.current = true;
      void save(v.currentTime, true);
    } else if (Math.abs(v.currentTime - lastSaved.current) >= SAVE_EVERY_S) {
      lastSaved.current = v.currentTime; // claim the slot before the request returns
      void save(v.currentTime);
    }
  }

  function onPause() {
    const v = videoRef.current;
    if (v && !v.ended && Math.abs(v.currentTime - lastSaved.current) >= 1) void save(v.currentTime);
  }

  // Save the position when the learner leaves the page mid-video.
  useEffect(() => {
    const v = videoRef.current;
    return () => {
      if (v && !v.paused && v.currentTime > 1) {
        navigator.sendBeacon?.(
          "/api/progress",
          new Blob([JSON.stringify({ lessonId: lesson.id, lastPosition: Math.floor(v.currentTime), completed: false })], { type: "application/json" })
        );
      }
    };
  }, [lesson.id]);

  const seek = (seconds: number) => {
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = seconds;
    void v.play().catch(() => {});
    v.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2">
        <h1 className="text-2xl font-semibold">{lesson.title}</h1>
        {lesson.is_preview ? <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-semibold">Free preview</span> : null}
      </div>

      {videoSrc ? (
        <div className="overflow-hidden rounded-2xl border border-border bg-black">
          <video
            ref={videoRef}
            src={videoSrc}
            controls
            playsInline
            preload="metadata"
            className="aspect-video w-full"
            onLoadedMetadata={onLoadedMetadata}
            onTimeUpdate={onTimeUpdate}
            onPause={onPause}
            onEnded={() => {
              if (completing.current) return;
              completing.current = true;
              void save(videoRef.current?.currentTime ?? 0, true);
            }}
            controlsList="nodownload"
          />
        </div>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex-1">
          <ProgressTracker value={percent} completed={completed} />
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground" aria-live="polite">
            {saving ? "Saving…" : savedAt !== null && !completed ? "Progress saved" : ""}
          </span>
          {completed ? null : (
            <Button
              size="sm"
              variant="secondary"
              onClick={() => {
                completing.current = true;
                void save(videoRef.current?.currentTime ?? 0, true);
              }}
              isLoading={saving}
              loadingText="Saving…"
            >
              Mark as complete
            </Button>
          )}
        </div>
      </div>

      <LessonContent content={lesson.content} />

      {previewOnly ? (
        <p className="rounded-lg border border-border bg-muted/40 p-3 text-sm text-muted-foreground">
          This is a free preview lesson. A plan unlocks the rest of the course.
        </p>
      ) : null}

      <NotesPanel lessonId={lesson.id} initialNotes={initialNotes} currentTime={() => videoRef.current?.currentTime ?? null} onSeek={videoSrc ? seek : undefined} />
    </div>
  );
}
