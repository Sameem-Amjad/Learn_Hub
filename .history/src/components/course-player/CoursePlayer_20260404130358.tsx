"use client";

import { useState } from "react";

import { LessonContent } from "@/components/course-player/LessonContent";
import { NotesPanel } from "@/components/course-player/NotesPanel";
import { ProgressTracker } from "@/components/course-player/ProgressTracker";

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

  async function updateProgress(value: number) {
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
  }

  return (
    <div className="space-y-6">
      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        <div className="aspect-video w-full bg-gradient-to-r from-[#0f2027] via-[#203a43] to-[#2c5364] p-6 text-white">
          <p className="text-xs uppercase tracking-[0.2em]">Now Playing</p>
          <h1 className="mt-2 text-2xl font-semibold">{lesson.title}</h1>
          <p className="mt-4 text-sm text-white/80">Module: {moduleSlug} | Course: {courseSlug}</p>
          <button className="mt-6 rounded bg-white px-4 py-2 text-sm text-black" onClick={() => updateProgress(progress + 10)}>
            Simulate +10% Progress
          </button>
        </div>
      </div>
      <ProgressTracker value={progress} />
      <LessonContent content={lesson.content} />
      <NotesPanel lessonId={lesson.id} />
    </div>
  );
}
