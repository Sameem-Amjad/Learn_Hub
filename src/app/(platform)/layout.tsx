import { MobileNav, Sidebar } from "@/components/layout/Sidebar";
import { ensureProfile } from "@/lib/server/profile";
import { getCurrentUser } from "@/lib/supabase/server";
import { isAdminUser } from "@/lib/utils/admin-auth";

export default async function PlatformLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (user) await ensureProfile(user);
  const isAdmin = user ? await isAdminUser(user.id) : false;

  return (
    <div className="mx-auto flex w-full max-w-7xl">
      <Sidebar isAdmin={isAdmin} />
      <div className="min-w-0 flex-1">
        <MobileNav isAdmin={isAdmin} />
        {children}
      </div>
    </div>
  );
}
