import { AccessControl } from "@/components/admin/AccessControl";
import { CourseEditor } from "@/components/admin/CourseEditor";
import { UserManagement } from "@/components/admin/UserManagement";

export default function AdminPage() {
  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 px-4 py-10">
      <h1 className="text-3xl font-bold">Admin Dashboard</h1>
      <UserManagement />
      <CourseEditor />
      <AccessControl />
    </div>
  );
}
