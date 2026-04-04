import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const features = [
  "Tiered premium curriculum",
  "Secure media access by subscription",
  "Progress, notes, and bookmarks",
  "Admin controls for content and users"
];

export default function HomePage() {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-16">
      <section className="grid gap-10 lg:grid-cols-2 lg:items-center">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-secondary">Premium Learning</p>
          <h1 className="mt-4 text-5xl font-bold leading-tight">LearnHub helps ambitious learners go from consuming to shipping.</h1>
          <p className="mt-5 text-lg text-muted-foreground">
            Structured pathways, high-signal lessons, and premium resources in one platform.
          </p>
          <div className="mt-8 flex gap-3">
            <Link href="/pricing">
              <Button size="lg">View Pricing</Button>
            </Link>
            <Link href="/signup">
              <Button variant="secondary" size="lg">
                Start Free Setup
              </Button>
            </Link>
          </div>
        </div>
        <Card className="border-secondary/60">
          <CardContent className="p-8">
            <h2 className="text-xl font-semibold">Built for focus</h2>
            <ul className="mt-4 space-y-3">
              {features.map((feature) => (
                <li key={feature} className="rounded-lg bg-muted/60 px-3 py-2 text-sm">
                  {feature}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
