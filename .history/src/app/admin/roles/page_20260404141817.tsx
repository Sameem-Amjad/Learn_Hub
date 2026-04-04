import { AdminRolesManagement } from "@/components/admin/AdminRolesManagement";

export default function AdminRolesPage() {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-10">
      <h1 className="mb-6 text-3xl font-bold">Roles</h1>
      <AdminRolesManagement />
    </div>
  );
}
