"use client";

import { useQuery } from "@tanstack/react-query";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface AnalyticsResponse {
  users: number;
  activeSubscriptions: number;
  pastDue: number;
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
          <CardTitle>Learners</CardTitle>
        </CardHeader>
        <CardContent className="text-2xl font-semibold">{data.users}</CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Active plans</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-semibold">{data.activeSubscriptions}</p>
          <p className="text-xs text-muted-foreground">{data.pastDue} past due</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Lessons finished</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-semibold">{data.completionRate}%</p>
          <p className="text-xs text-muted-foreground">of started lessons are complete</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Plans by tier</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Insider: {data.byTier.insider}</p>
          <p>Core: {data.byTier.core}</p>
          <p>Pro: {data.byTier.pro}</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Published courses</CardTitle>
        </CardHeader>
        <CardContent className="text-2xl font-semibold">{data.publishedCourses}</CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Lessons</CardTitle>
        </CardHeader>
        <CardContent className="text-2xl font-semibold">{data.lessons}</CardContent>
      </Card>
    </div>
  );
}
