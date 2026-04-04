import Link from "next/link";

export default async function CourseDetailPage({
  params
}: {
  params: Promise<{ courseSlug: string }>;
}) {
  const { courseSlug } = await params;

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-10">
      <h1 className="text-3xl font-bold capitalize">{courseSlug.replaceAll("-", " ")}</h1>
      <p className="mt-3 text-muted-foreground">Explore modules and continue your path.</p>
      <div className="mt-6 rounded-xl border border-border p-4">
        <Link href={`/courses/${courseSlug}/module-1/lesson-1`} className="text-primary underline">
          Start Module 1 / Lesson 1
        </Link>
      </div>
    </div>
  );
}
