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
  title: string;
  modules: ModuleItem[];
}

export function ModuleSidebar({
  course,
  currentModuleSlug,
  currentLessonSlug,
  completedIds,
  unlocked
}: {
  course: CourseShape;
  currentModuleSlug: string;
  currentLessonSlug: string;
  completedIds: string[];
  unlocked: boolean;
}) {
  const done = new Set(completedIds);

  return (
    <aside className="h-fit space-y-4 rounded-xl border border-border p-4 lg:sticky lg:top-20">
      <p className="text-sm font-semibold">{course.title}</p>
      {course.modules.map((module) => (
        <div key={module.id}>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{module.title}</h3>
          <ul className="space-y-1">
            {module.lessons.map((lesson) => {
              const isActive = module.slug === currentModuleSlug && lesson.slug === currentLessonSlug;
              const open = unlocked || lesson.is_preview;
              const inner = (
                <>
                  <span aria-hidden className={`w-4 text-center text-xs ${done.has(lesson.id) ? "text-primary" : "text-muted-foreground"}`}>
                    {done.has(lesson.id) ? "✓" : open ? "•" : "🔒"}
                  </span>
                  <span className="flex-1">{lesson.title}</span>
                  {lesson.is_preview && !unlocked ? <Badge>Preview</Badge> : null}
                </>
              );
              return (
                <li key={lesson.id}>
                  {open ? (
                    <Link
                      href={`/courses/${course.slug}/${module.slug}/${lesson.slug}`}
                      aria-current={isActive ? "page" : undefined}
                      className={`flex items-center gap-2 rounded px-2 py-1.5 text-sm ${
                        isActive ? "bg-primary/20 text-foreground" : "text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      {inner}
                    </Link>
                  ) : (
                    <div className="flex items-center gap-2 px-2 py-1.5 text-sm text-muted-foreground/70">{inner}</div>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </aside>
  );
}
