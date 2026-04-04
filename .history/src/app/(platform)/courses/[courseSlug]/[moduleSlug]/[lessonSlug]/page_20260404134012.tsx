import { CoursePlayer } from "@/components/course-player/CoursePlayer";
import { ModuleSidebar } from "@/components/course-player/ModuleSidebar";
import { getCourseWithModules, getUserTier } from "@/lib/server/learning-data";
import { getCurrentUser } from "@/lib/supabase/server";
import { hasAccess } from "@/lib/utils/tier-comparison";
import { notFound, redirect } from "next/navigation";

export default async function LessonPage({
  params
}: {
  params: Promise<{ courseSlug: string; moduleSlug: string; lessonSlug: string }>;
}) {
  const { courseSlug, moduleSlug, lessonSlug } = await params;
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const course = await getCourseWithModules(courseSlug);
  if (!course) {
    notFound();
  }

  const tier = await getUserTier(user.id);
  if (!tier || !hasAccess(tier, course.required_tier)) {
    redirect("/pricing");
  }

  const activeModule = course.modules.find((module) => module.slug === moduleSlug);
  const activeLesson = activeModule?.lessons.find((lesson) => lesson.slug === lessonSlug);

  if (!activeModule || !activeLesson) {
    notFound();
  }

  return (
    <div className="mx-auto grid w-full max-w-7xl gap-6 px-4 py-10 lg:grid-cols-[280px,1fr]">
      <ModuleSidebar course={course} currentModuleSlug={moduleSlug} currentLessonSlug={lessonSlug} />
      <CoursePlayer
        moduleSlug={moduleSlug}
        courseSlug={courseSlug}
        lesson={{
          id: activeLesson.id,
          title: activeLesson.title,
          content: activeLesson.content,
          video_url: activeLesson.video_url
        }}
      />
    </div>
  );
}
