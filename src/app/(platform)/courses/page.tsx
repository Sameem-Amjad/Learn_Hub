import Link from "next/link";
import { redirect } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { ProgressBar } from "@/components/ui/progress";
import { getCoursesForUser } from "@/lib/server/learning-data";
import { getCurrentUser } from "@/lib/supabase/server";
import { TIER_LABEL } from "@/lib/utils/format";

export default async function CoursesPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const courses = await getCoursesForUser(user.id);

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-10">
      <h1 className="text-3xl font-bold">Courses</h1>
      <p className="mt-2 text-muted-foreground">Each course needs a plan tier or higher. Preview lessons are open to everyone signed in.</p>
      <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {courses.map((course) => (
          <Link
            key={course.slug}
            href={`/courses/${course.slug}`}
            className="group flex flex-col overflow-hidden rounded-xl border border-border bg-card transition hover:border-primary/60"
          >
            {course.thumbnail_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={course.thumbnail_url} alt="" className="aspect-[16/9] w-full object-cover opacity-90 transition group-hover:opacity-100" />
            ) : null}
            <div className="flex flex-1 flex-col gap-3 p-5">
              <div className="flex items-center gap-2">
                <Badge>{TIER_LABEL[course.required_tier]}</Badge>
                {course.has_access ? null : <Badge className="bg-muted text-muted-foreground">Locked</Badge>}
              </div>
              <h2 className="text-lg font-semibold">{course.title}</h2>
              <p className="flex-1 text-sm text-muted-foreground">{course.description}</p>
              {course.has_access ? (
                <div className="space-y-1">
                  <ProgressBar value={course.lesson_count ? (course.completed_count / course.lesson_count) * 100 : 0} label={`${course.title} progress`} />
                  <p className="text-xs text-muted-foreground">
                    {course.completed_count} of {course.lesson_count} lessons completed
                  </p>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">
                  {course.lesson_count} lessons · {course.preview_count} free preview · needs {TIER_LABEL[course.required_tier]} or higher
                </p>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
