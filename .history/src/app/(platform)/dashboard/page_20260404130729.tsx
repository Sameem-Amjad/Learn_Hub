import Link from "next/link";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function DashboardPage() {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-10">
      <h1 className="text-3xl font-bold">Welcome to your dashboard</h1>
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Continue Watching</CardTitle>
          </CardHeader>
          <CardContent>
            <Link href="/courses" className="text-primary underline">
              Resume your latest lesson
            </Link>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Progress</CardTitle>
          </CardHeader>
          <CardContent>Track completed modules and lesson streaks.</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Pro Sessions</CardTitle>
          </CardHeader>
          <CardContent>Upcoming 1-on-1 sessions appear here.</CardContent>
        </Card>
      </div>
    </div>
  );
}
