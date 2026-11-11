import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { CoursePlayer } from "@/components/course-player/CoursePlayer";
import { ModuleSidebar } from "@/components/course-player/ModuleSidebar";
import { getCourseWithModules, getNotesForLesson, getProgressMap, getUserTier } from "@/lib/server/learning-data";
import { getCurrentUser } from "@/lib/supabase/server";
import { lessonVideoUrl } from "@/lib/utils/signed-urls";
import { hasAccess } from "@/lib/utils/tier-comparison";

export default async function LessonPage({
  params
}: {
  params: Promise<{ courseSlug: string; moduleSlug: string; lessonSlug: string }>;
}) {
  const { courseSlug, moduleSlug, lessonSlug } = await params;
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const [course, tier, progress] = await Promise.all([getCourseWithModules(courseSlug), getUserTier(user.id), getProgressMap(user.id)]);
  if (!course) {
    notFound();
  }

  const activeModule = course.modules.find((module) => module.slug === moduleSlug);
  const activeLesson = activeModule?.lessons.find((lesson) => lesson.slug === lessonSlug);
  if (!activeModule || !activeLesson) {
    notFound();
  }

  // Preview lessons are open to everyone signed in; the rest need the course's tier.
  const unlocked = Boolean(tier && hasAccess(tier, course.required_tier));
  if (!unlocked && !activeLesson.is_preview) {
    redirect(`/pricing?course=${course.slug}`);
  }

  const ordered = course.modules.flatMap((m) => m.lessons.map((l) => ({ ...l, moduleSlug: m.slug })));
  const at = ordered.findIndex((l) => l.id === activeLesson.id);
  const href = (l: (typeof ordered)[number]) => `/courses/${course.slug}/${l.moduleSlug}/${l.slug}`;
  const canOpen = (l: (typeof ordered)[number]) => unlocked || l.is_preview;
  const prev = ordered.slice(0, at).reverse().find(canOpen);
  const next = ordered.slice(at + 1).find(canOpen);

  const [videoSrc, notes] = await Promise.all([lessonVideoUrl(activeLesson.video_url), getNotesForLesson(user.id, activeLesson.id)]);
  const mine = progress.get(activeLesson.id);
  const completedIds = ordered.filter((l) => progress.get(l.id)?.completed).map((l) => l.id);

  return (
    <div className="mx-auto grid w-full max-w-7xl gap-6 px-4 py-8 lg:grid-cols-[280px_1fr]">
      <ModuleSidebar
        course={course}
        currentModuleSlug={moduleSlug}
        currentLessonSlug={lessonSlug}
        completedIds={completedIds}
        unlocked={unlocked}
      />
      <div className="min-w-0 space-y-4">
        <nav className="text-sm text-muted-foreground">
          <Link href={`/courses/${course.slug}`} className="hover:text-foreground">{course.title}</Link>
          <span aria-hidden> / </span>
          <span>{activeModule.title}</span>
        </nav>
        <CoursePlayer
          key={activeLesson.id}
          lesson={{
            id: activeLesson.id,
            title: activeLesson.title,
            content: activeLesson.content,
            duration: activeLesson.duration,
            is_preview: activeLesson.is_preview
          }}
          videoSrc={videoSrc}
          initialPosition={mine?.completed ? 0 : (mine?.last_position ?? 0)}
          initiallyCompleted={Boolean(mine?.completed)}
          initialNotes={notes}
          previewOnly={!unlocked}
        />
        <div className="flex items-center justify-between gap-3 border-t border-border pt-4 text-sm">
          {prev ? (
            <Link href={href(prev)} className="text-muted-foreground hover:text-foreground">← {prev.title}</Link>
          ) : <span />}
          {next ? (
            <Link href={href(next)} className="text-right font-medium text-primary hover:underline">Next: {next.title} →</Link>
          ) : unlocked ? (
            <Link href={`/courses/${course.slug}`} className="font-medium text-primary hover:underline">Back to the course</Link>
          ) : (
            <Link href={`/pricing?course=${course.slug}`} className="font-medium text-primary hover:underline">Unlock the full course →</Link>
          )}
        </div>
      </div>
    </div>
  );
}
