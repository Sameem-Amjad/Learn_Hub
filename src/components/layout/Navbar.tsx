import Link from "next/link";
import { unstable_noStore as noStore } from "next/cache";

import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/supabase/server";
import { isAdminUser } from "@/lib/utils/admin-auth";

export async function Navbar() {
  noStore();
  const user = await getCurrentUser();
  const isAdmin = user ? await isAdminUser(user.id) : false;

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-3 px-4">
        <Link href={user ? "/dashboard" : "/"} className="text-xl font-bold tracking-tight text-foreground">
          LearnHub
        </Link>
        <nav className="hidden gap-6 text-sm text-muted-foreground md:flex">
          {user ? (
            <>
              <Link href="/dashboard" className="hover:text-foreground">Dashboard</Link>
              <Link href="/courses" className="hover:text-foreground">Courses</Link>
              <Link href="/library" className="hover:text-foreground">Library</Link>
            </>
          ) : (
            <Link href="/about" className="hover:text-foreground">About</Link>
          )}
          <Link href="/pricing" className="hover:text-foreground">Pricing</Link>
          {isAdmin ? <Link href="/admin" className="hover:text-foreground">Admin</Link> : null}
        </nav>
        <div className="flex items-center gap-2">
          {user ? (
            <>
              <span className="hidden max-w-[14rem] truncate text-xs text-muted-foreground lg:inline" title={user.email ?? ""}>
                {user.email}
              </span>
              <form action="/api/auth/signout" method="post">
                <Button type="submit" variant="ghost" size="sm">
                  Log out
                </Button>
              </form>
            </>
          ) : (
            <>
              <Link href="/login">
                <Button variant="ghost" size="sm">Log in</Button>
              </Link>
              <Link href="/signup">
                <Button size="sm">Get started</Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
