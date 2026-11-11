import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { ProgressBar } from "@/components/ui/progress";
import { getCourseWithModules, getProgressMap, getUserTier } from "@/lib/server/learning-data";
import { getCurrentUser } from "@/lib/supabase/server";
import { TIER_LABEL, minutes } from "@/lib/utils/format";
import { hasAccess } from "@/lib/utils/tier-comparison";

export default async function CourseDetailPage({ params }: { params: Promise<{ courseSlug: string }> }) {
  const { courseSlug } = await params;
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const [course, tier, progress] = await Promise.all([getCourseWithModules(courseSlug), getUserTier(user.id), getProgressMap(user.id)]);
  if (!course) {
    notFound();
  }

  const unlocked = Boolean(tier && hasAccess(tier, course.required_tier));
  const lessons = course.modules.flatMap((m) => m.lessons.map((l) => ({ ...l, moduleSlug: m.slug })));
  const done = lessons.filter((l) => progress.get(l.id)?.completed).length;
  const open = (l: (typeof lessons)[number]) => unlocked || l.is_preview;
  // Resume the first unfinished lesson the learner can open.
  const next = lessons.find((l) => open(l) && !progress.get(l.id)?.completed) ?? lessons.find(open);

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-10">
      <div className="flex flex-col gap-6 md:flex-row">
        {course.thumbnail_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={course.thumbnail_url} alt="" className="aspect-[16/9] w-full rounded-xl object-cover md:w-80" />
        ) : null}
        <div className="flex-1 space-y-3">
          <Badge>{TIER_LABEL[course.required_tier]} plan</Badge>
          <h1 className="text-3xl font-bold">{course.title}</h1>
          <p className="text-muted-foreground">{course.description}</p>
          {unlocked ? (
            <div className="max-w-sm space-y-1">
              <ProgressBar value={lessons.length ? (done / lessons.length) * 100 : 0} label="Course progress" />
              <p className="text-xs text-muted-foreground">{done} of {lessons.length} lessons completed</p>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              This course needs the {TIER_LABEL[course.required_tier]} plan or higher. Lessons marked Preview are free to watch.{" "}
              <Link href="/pricing" className="text-primary underline">See plans</Link>
            </p>
          )}
          {next ? (
            <Link
              href={`/courses/${course.slug}/${next.moduleSlug}/${next.slug}`}
              className="inline-flex h-10 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:brightness-110"
            >
              {done > 0 ? "Continue" : unlocked ? "Start the course" : "Watch the preview"}: {next.title}
            </Link>
          ) : null}
        </div>
      </div>

      <div className="mt-10 space-y-6">
        {course.modules.map((module, mi) => (
          <section key={module.id} className="rounded-xl border border-border">
            <div className="border-b border-border p-4">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Module {mi + 1}</p>
              <h2 className="font-semibold">{module.title}</h2>
              {module.description ? <p className="text-sm text-muted-foreground">{module.description}</p> : null}
            </div>
            <ul>
              {module.lessons.map((lesson) => {
                const p = progress.get(lesson.id);
                const canOpen = unlocked || lesson.is_preview;
                const row = (
                  <div className="flex items-center gap-3 px-4 py-3">
                    <span
                      aria-hidden
                      className={`grid h-6 w-6 shrink-0 place-items-center rounded-full border text-xs ${p?.completed ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted-foreground"}`}
                    >
                      {p?.completed ? "✓" : canOpen ? "▶" : "🔒"}
                    </span>
                    <span className={`flex-1 text-sm ${canOpen ? "" : "text-muted-foreground"}`}>{lesson.title}</span>
                    {lesson.is_preview ? <Badge>Preview</Badge> : null}
                    <span className="w-14 text-right text-xs text-muted-foreground">{lesson.video_url ? minutes(lesson.duration) : "Reading"}</span>
                  </div>
                );
                return (
                  <li key={lesson.id} className="border-t border-border first:border-t-0">
                    {canOpen ? (
                      <Link href={`/courses/${course.slug}/${module.slug}/${lesson.slug}`} className="block hover:bg-muted/60">
                        <span className="sr-only">{p?.completed ? "Completed: " : ""}</span>
                        {row}
                      </Link>
                    ) : (
                      <div title={`Needs the ${TIER_LABEL[course.required_tier]} plan`}>{row}</div>
                    )}
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
