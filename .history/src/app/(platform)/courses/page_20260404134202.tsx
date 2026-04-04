import Link from "next/link";
import { redirect } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCoursesForUser } from "@/lib/server/learning-data";
import { getCurrentUser } from "@/lib/supabase/server";

export default async function CoursesPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const courses = await getCoursesForUser(user.id);

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-10">
      <h1 className="text-3xl font-bold">Courses</h1>
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {courses.map((course) => (
          <Card key={course.slug}>
            <CardHeader>
              <CardTitle>{course.title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Badge>{course.required_tier}</Badge>
              {course.has_access ? (
                <Link href={`/courses/${course.slug}`} className="block text-primary underline">
                  Open course
                </Link>
              ) : (
                <p className="text-sm text-muted-foreground">Upgrade subscription to unlock</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
