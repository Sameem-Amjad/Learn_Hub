import Link from "next/link";
import { notFound } from "next/navigation";

import { getCourseWithModules } from "@/lib/server/learning-data";

export default async function CourseDetailPage({
  params
}: {
  params: Promise<{ courseSlug: string }>;
}) {
  const { courseSlug } = await params;
  const course = await getCourseWithModules(courseSlug);

  if (!course) {
    notFound();
  }

  const firstModule = course.modules[0];
  const firstLesson = firstModule?.lessons[0];

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-10">
      <h1 className="text-3xl font-bold capitalize">{course.title}</h1>
      <p className="mt-3 text-muted-foreground">Explore modules and continue your path.</p>
      {firstModule && firstLesson ? (
        <div className="mt-6 rounded-xl border border-border p-4">
          <Link href={`/courses/${courseSlug}/${firstModule.slug}/${firstLesson.slug}`} className="text-primary underline">
            Start {firstModule.title} / {firstLesson.title}
          </Link>
        </div>
      ) : (
        <p className="mt-6 text-sm text-muted-foreground">No modules published yet.</p>
      )}
    </div>
  );
}
