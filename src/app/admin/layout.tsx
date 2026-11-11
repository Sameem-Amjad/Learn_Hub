import { AdminTabs } from "@/components/admin/AdminTabs";
import { isNoDeleteUser } from "@/lib/demo";
import { getCurrentUser } from "@/lib/supabase/server";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // The proxy already sends non-admins away from /admin.
  const user = await getCurrentUser();

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 px-4 py-10">
      <div>
        <h1 className="text-3xl font-bold">Admin</h1>
        {isNoDeleteUser(user) ? (
          <p className="mt-2 text-sm text-muted-foreground">
            Demo admin: change plans and roles for the sample learners freely. The shared demo logins, visitors&apos; accounts and
            removing roles are locked so the demo stays usable for everyone.
          </p>
        ) : null}
      </div>
      <AdminTabs />
      {children}
    </div>
  );
}
