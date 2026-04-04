import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const courses = [
  { slug: "product-strategy", title: "Product Strategy", tier: "insider" },
  { slug: "systems-design", title: "Systems Design", tier: "core" },
  { slug: "executive-communication", title: "Executive Communication", tier: "pro" }
];

export default function CoursesPage() {
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
              <Badge>{course.tier}</Badge>
              <Link href={`/courses/${course.slug}`} className="block text-primary underline">
                Open course
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
