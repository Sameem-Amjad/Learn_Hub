import Link from "next/link";
import { redirect } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProgressBar } from "@/components/ui/progress";
import { getCoursesForUser, getDashboardProgress, getProfile, getSubscription } from "@/lib/server/learning-data";
import { getCurrentUser } from "@/lib/supabase/server";
import { isAdminUser } from "@/lib/utils/admin-auth";
import { planIsLive } from "@/lib/utils/plan";
import { STATUS_LABEL, TIER_LABEL, clock, shortDate } from "@/lib/utils/format";

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ plan?: string }> }) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const [{ plan: justActivated }, profile, progress, subscription, courses, isAdmin] = await Promise.all([
    searchParams,
    getProfile(user.id),
    getDashboardProgress(user.id),
    getSubscription(user.id),
    getCoursesForUser(user.id),
    isAdminUser(user.id)
  ]);

  const firstName = (profile?.full_name ?? "").split(" ")[0];
  const planActive = planIsLive(subscription);

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-10">
      <h1 className="text-3xl font-bold">{firstName ? `Welcome back, ${firstName}` : "Welcome to LearnHub"}</h1>
      <p className="mt-2 text-muted-foreground">Pick up where you left off, or start something new.</p>

      {justActivated && subscription && planActive ? (
        <p role="status" className="mt-6 rounded-lg border border-primary/40 bg-primary/10 px-4 py-3 text-sm">
          Your {TIER_LABEL[subscription.tier]} plan is active. Every course it covers is now unlocked.
        </p>
      ) : null}

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Continue learning</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {progress.resume ? (
              <>
                <p className="text-sm text-muted-foreground">{progress.resume.courseTitle}</p>
                <p className="font-medium">{progress.resume.title}</p>
                <p className="text-xs text-muted-foreground">
                  {progress.resume.upNext
                    ? "Up next in this course"
                    : progress.resume.completed
                      ? "Course complete: watch it again any time"
                      : progress.resume.position > 0
                        ? `Stopped at ${clock(progress.resume.position)}${progress.resume.duration ? ` of ${clock(progress.resume.duration)}` : ""}`
                        : "Not started yet"}
                </p>
                <Link href={progress.resume.href} className="inline-block text-sm font-medium text-primary underline">
                  {progress.resume.upNext || progress.resume.position === 0 ? "Start lesson" : "Resume lesson"}
                </Link>
              </>
            ) : (
              <>
                <p className="text-sm text-muted-foreground">You haven&apos;t started a lesson yet.</p>
                <Link href="/courses" className="inline-block text-sm font-medium text-primary underline">
                  Browse courses
                </Link>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Progress</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-3xl font-semibold">{progress.completionRate}%</p>
            <ProgressBar value={progress.completionRate} label="Overall progress" />
            <p className="text-sm text-muted-foreground">
              {progress.completedLessons} of {progress.totalLessons} lessons completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Your plan</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {subscription ? (
              <>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-semibold">{TIER_LABEL[subscription.tier]}</span>
                  <Badge className={planActive ? "" : "bg-muted text-muted-foreground"}>{planActive || subscription.status !== "active" ? (STATUS_LABEL[subscription.status] ?? subscription.status) : "Ended"}</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {planActive
                    ? `Renews ${shortDate(subscription.current_period_end)}`
                    : subscription.status === "past_due"
                      ? "Payment failed: courses stay locked until the plan is paid."
                      : `Ended ${shortDate(subscription.current_period_end)}`}
                </p>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">No plan yet. Preview lessons are free to watch.</p>
            )}
            <Link href={planActive ? "/settings/billing" : "/pricing"} className="inline-block text-sm font-medium text-primary underline">
              {planActive ? "Manage plan" : "See plans"}
            </Link>
          </CardContent>
        </Card>
      </div>

      <h2 className="mt-10 text-xl font-semibold">Your courses</h2>
      <div className="mt-4 grid gap-3">
        {courses.map((course) => (
          <Link
            key={course.id}
            href={`/courses/${course.slug}`}
            className="flex flex-col gap-2 rounded-xl border border-border p-4 transition hover:border-primary/60 sm:flex-row sm:items-center sm:gap-6"
          >
            <div className="min-w-0 flex-1">
              <p className="font-medium">{course.title}</p>
              <p className="text-xs text-muted-foreground">
                {course.has_access ? `${course.completed_count} of ${course.lesson_count} lessons` : `${TIER_LABEL[course.required_tier]} plan · ${course.preview_count} free preview`}
              </p>
            </div>
            <div className="w-full sm:w-56">
              {course.has_access ? (
                <ProgressBar value={course.lesson_count ? (course.completed_count / course.lesson_count) * 100 : 0} label={`${course.title} progress`} />
              ) : (
                <Badge className="bg-muted text-muted-foreground">Locked</Badge>
              )}
            </div>
          </Link>
        ))}
      </div>

      {isAdmin ? (
        <Card className="mt-10">
          <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-medium">Admin access</p>
              <p className="text-sm text-muted-foreground">Users, plans, roles, courses and the audit log.</p>
            </div>
            <Link href="/admin" className="text-sm font-medium text-primary underline">
              Open the admin panel
            </Link>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
