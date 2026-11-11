import Link from "next/link";
import { redirect } from "next/navigation";

import { ProgressBar } from "@/components/ui/progress";
import { getCoursesForUser, getDashboardProgress } from "@/lib/server/learning-data";
import { getCurrentUser } from "@/lib/supabase/server";
import { TIER_LABEL } from "@/lib/utils/format";

export default async function MyProgressPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const [progress, courses] = await Promise.all([getDashboardProgress(user.id), getCoursesForUser(user.id)]);
  const started = courses.filter((c) => c.completed_count > 0).length;

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-10">
      <h1 className="text-3xl font-bold">My progress</h1>
      <p className="mt-2 text-muted-foreground">Lessons count as complete once you have watched 90% of the video or marked them done.</p>
      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-border p-4">
          <p className="text-xs text-muted-foreground">Overall completion</p>
          <p className="text-2xl font-semibold">{progress.completionRate}%</p>
        </div>
        <div className="rounded-xl border border-border p-4">
          <p className="text-xs text-muted-foreground">Lessons completed</p>
          <p className="text-2xl font-semibold">
            {progress.completedLessons} <span className="text-base font-normal text-muted-foreground">of {progress.totalLessons}</span>
          </p>
        </div>
        <div className="rounded-xl border border-border p-4">
          <p className="text-xs text-muted-foreground">Courses started</p>
          <p className="text-2xl font-semibold">
            {started} <span className="text-base font-normal text-muted-foreground">of {courses.length}</span>
          </p>
        </div>
      </div>

      <h2 className="mt-10 text-xl font-semibold">By course</h2>
      <div className="mt-4 space-y-3">
        {courses.map((c) => {
          const pct = c.lesson_count ? (c.completed_count / c.lesson_count) * 100 : 0;
          return (
            <Link key={c.id} href={`/courses/${c.slug}`} className="block rounded-xl border border-border p-4 transition hover:border-primary/60">
              <div className="flex items-center justify-between gap-3">
                <p className="font-medium">{c.title}</p>
                <p className="text-sm text-muted-foreground">
                  {c.has_access ? `${Math.round(pct)}%` : `Needs ${TIER_LABEL[c.required_tier]}`}
                </p>
              </div>
              <ProgressBar value={pct} className="mt-3" label={`${c.title} progress`} />
              <p className="mt-2 text-xs text-muted-foreground">{c.completed_count} of {c.lesson_count} lessons</p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
