"use client";

import { useState } from "react";

import { LessonContent } from "@/components/course-player/LessonContent";
import { NotesPanel } from "@/components/course-player/NotesPanel";
import { ProgressTracker } from "@/components/course-player/ProgressTracker";
import { Button } from "@/components/ui/button";

export function CoursePlayer({
  lesson,
  moduleSlug,
  courseSlug
}: {
  lesson: { id: string; content: string | null; video_url: string | null; title: string };
  moduleSlug: string;
  courseSlug: string;
}) {
  const [progress, setProgress] = useState(0);
  const [savingProgress, setSavingProgress] = useState(false);

  async function updateProgress(value: number) {
    setSavingProgress(true);
    setProgress(value);
    await fetch("/api/progress", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        lessonId: lesson.id,
        lastPosition: Math.floor(value),
        completed: value >= 90
      })
    });
    setSavingProgress(false);
  }

  return (
    <div className="space-y-6">
      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        <div className="aspect-video w-full bg-gradient-to-r from-[#0f2027] via-[#203a43] to-[#2c5364] p-6 text-white">
          <p className="text-xs uppercase tracking-[0.2em]">Now Playing</p>
          <h1 className="mt-2 text-2xl font-semibold">{lesson.title}</h1>
          <p className="mt-4 text-sm text-white/80">Module: {moduleSlug} | Course: {courseSlug}</p>
          <Button
            className="mt-6 bg-white text-black hover:bg-white/90"
            onClick={() => updateProgress(progress + 10)}
            isLoading={savingProgress}
            loadingText="Saving..."
          >
            Simulate +10% Progress
          </Button>
        </div>
      </div>
      <ProgressTracker value={progress} />
      <LessonContent content={lesson.content} />
      <NotesPanel lessonId={lesson.id} />
    </div>
  );
}
