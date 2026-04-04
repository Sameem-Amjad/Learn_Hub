import { getDashboardProgress } from "@/lib/server/learning-data";
import { getCurrentUser } from "@/lib/supabase/server";

export default async function MyProgressPage() {
  const user = await getCurrentUser();
  const progress = user
    ? await getDashboardProgress(user.id)
    : { completionRate: 0, completedLessons: 0, totalLessons: 0, latestPosition: 0 };

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-10">
      <h1 className="text-3xl font-bold">My Progress</h1>
      <p className="mt-3 text-muted-foreground">Track completion percentages, time spent, and streaks.</p>
      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-border p-4">
          <p className="text-xs text-muted-foreground">Completion</p>
          <p className="text-2xl font-semibold">{progress.completionRate}%</p>
        </div>
        <div className="rounded-xl border border-border p-4">
          <p className="text-xs text-muted-foreground">Completed Lessons</p>
          <p className="text-2xl font-semibold">{progress.completedLessons}</p>
        </div>
        <div className="rounded-xl border border-border p-4">
          <p className="text-xs text-muted-foreground">Latest Position</p>
          <p className="text-2xl font-semibold">{progress.latestPosition}</p>
        </div>
      </div>
    </div>
  );
}
