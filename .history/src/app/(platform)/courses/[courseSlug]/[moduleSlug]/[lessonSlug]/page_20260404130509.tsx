import { CoursePlayer } from "@/components/course-player/CoursePlayer";
import { ModuleSidebar } from "@/components/course-player/ModuleSidebar";

export default async function LessonPage({
  params
}: {
  params: Promise<{ courseSlug: string; moduleSlug: string; lessonSlug: string }>;
}) {
  const { courseSlug, moduleSlug, lessonSlug } = await params;

  const course = {
    slug: courseSlug,
    modules: [
      {
        id: "m1",
        title: "Module 1",
        slug: moduleSlug,
        lessons: [
          { id: "l1", title: "Lesson 1", slug: lessonSlug, is_preview: false },
          { id: "l2", title: "Lesson 2", slug: "lesson-2", is_preview: true }
        ]
      }
    ]
  };

  return (
    <div className="mx-auto grid w-full max-w-7xl gap-6 px-4 py-10 lg:grid-cols-[280px,1fr]">
      <ModuleSidebar course={course} currentModuleSlug={moduleSlug} currentLessonSlug={lessonSlug} />
      <CoursePlayer
        moduleSlug={moduleSlug}
        courseSlug={courseSlug}
        lesson={{ id: "l1", title: "Lesson", content: "Deep dive lesson content.", video_url: null }}
      />
    </div>
  );
}
