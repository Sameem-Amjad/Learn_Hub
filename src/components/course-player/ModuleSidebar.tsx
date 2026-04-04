import Link from "next/link";

import { Badge } from "@/components/ui/badge";

interface LessonLink {
  id: string;
  title: string;
  slug: string;
  is_preview: boolean;
}

interface ModuleItem {
  id: string;
  title: string;
  slug: string;
  lessons: LessonLink[];
}

interface CourseShape {
  slug: string;
  modules: ModuleItem[];
}

export function ModuleSidebar({
  course,
  currentModuleSlug,
  currentLessonSlug
}: {
  course: CourseShape;
  currentModuleSlug: string;
  currentLessonSlug: string;
}) {
  return (
    <aside className="space-y-4 rounded-xl border border-border p-4">
      {course.modules.map((module) => (
        <div key={module.id}>
          <h3 className="mb-2 text-sm font-semibold">{module.title}</h3>
          <ul className="space-y-1">
            {module.lessons.map((lesson) => {
              const isActive = module.slug === currentModuleSlug && lesson.slug === currentLessonSlug;
              return (
                <li key={lesson.id}>
                  <Link
                    href={`/courses/${course.slug}/${module.slug}/${lesson.slug}`}
                    className={`flex items-center justify-between rounded px-2 py-1 text-sm ${
                      isActive ? "bg-primary/20 text-foreground" : "text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    <span>{lesson.title}</span>
                    {lesson.is_preview ? <Badge>Preview</Badge> : null}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </aside>
  );
}
