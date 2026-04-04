import { UserManagement } from "@/components/admin/UserManagement";

export default function AdminUsersPage() {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-10">
      <h1 className="mb-6 text-3xl font-bold">Users</h1>
      <UserManagement />
    </div>
  );
}
