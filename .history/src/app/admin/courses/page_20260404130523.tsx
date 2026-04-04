import { CourseEditor } from "@/components/admin/CourseEditor";

export default function AdminCoursesPage() {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-10">
      <h1 className="mb-6 text-3xl font-bold">Courses</h1>
      <CourseEditor />
    </div>
  );
}
