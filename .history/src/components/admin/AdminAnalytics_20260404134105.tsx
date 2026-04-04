"use client";

import { useQuery } from "@tanstack/react-query";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface AnalyticsResponse {
  users: number;
  activeSubscriptions: number;
  byTier: { insider: number; core: number; pro: number };
  publishedCourses: number;
  lessons: number;
  completionRate: number;
}

export function AdminAnalytics() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["admin-analytics"],
    queryFn: async (): Promise<AnalyticsResponse> => {
      const res = await fetch("/api/admin/analytics", { cache: "no-store" });
      if (!res.ok) {
        throw new Error("Failed to fetch analytics");
      }
      return (await res.json()) as AnalyticsResponse;
    }
  });

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Loading analytics...</p>;
  }

  if (error || !data) {
    return <p className="text-sm text-red-400">Analytics unavailable.</p>;
  }

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card>
        <CardHeader>
          <CardTitle>Total Users</CardTitle>
        </CardHeader>
        <CardContent>{data.users}</CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Active Subscriptions</CardTitle>
        </CardHeader>
        <CardContent>{data.activeSubscriptions}</CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Completion Rate</CardTitle>
        </CardHeader>
        <CardContent>{data.completionRate}%</CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Tier Mix</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Insider: {data.byTier.insider}</p>
          <p>Core: {data.byTier.core}</p>
          <p>Pro: {data.byTier.pro}</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Published Courses</CardTitle>
        </CardHeader>
        <CardContent>{data.publishedCourses}</CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Total Lessons</CardTitle>
        </CardHeader>
        <CardContent>{data.lessons}</CardContent>
      </Card>
    </div>
  );
}
