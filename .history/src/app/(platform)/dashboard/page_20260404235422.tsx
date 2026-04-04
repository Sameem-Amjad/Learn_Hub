import Link from "next/link";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getDashboardProgress } from "@/lib/server/learning-data";
import { getCurrentUser } from "@/lib/supabase/server";
import { isAdminUser } from "@/lib/utils/admin-auth";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  const isAdmin = user ? await isAdminUser(user.id) : false;
  const progress = user
    ? await getDashboardProgress(user.id)
    : { completionRate: 0, completedLessons: 0, totalLessons: 0, latestLessonId: null };

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-10">
      <h1 className="text-3xl font-bold">Welcome to your dashboard</h1>
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Continue Watching</CardTitle>
          </CardHeader>
          <CardContent>
            {progress.latestLessonId ? (
              <p className="text-sm text-muted-foreground">Latest lesson ID: {progress.latestLessonId}</p>
            ) : null}
            <Link href="/courses" className="text-primary underline">
              Resume learning
            </Link>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{progress.completionRate}% completion</p>
            <p className="text-sm text-muted-foreground">
              {progress.completedLessons} of {progress.totalLessons} lessons completed
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Pro Sessions</CardTitle>
          </CardHeader>
          <CardContent>Upcoming 1-on-1 sessions appear here.</CardContent>
        </Card>
        {isAdmin ? (
          <Card>
            <CardHeader>
              <CardTitle>Admin Access</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">You have admin permissions for operations and analytics.</p>
              <Link href="/admin" className="text-primary underline">
                Open Admin Panel
              </Link>
            </CardContent>
          </Card>
        ) : null}
      </div>
    </div>
  );
}
