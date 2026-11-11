"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils/cn";

const links = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/courses", label: "Courses" },
  { href: "/library", label: "Library" },
  { href: "/my-progress", label: "My Progress" },
  { href: "/settings", label: "Settings" }
];

const adminLinks = [
  { href: "/admin", label: "Admin overview" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/roles", label: "Roles" }
];

export function Sidebar({ isAdmin }: { isAdmin: boolean }) {
  const pathname = usePathname();
  const item = (link: { href: string; label: string }) => {
    const active = pathname === link.href || (link.href !== "/admin" && pathname.startsWith(`${link.href}/`));
    return (
      <Link
        key={link.href}
        href={link.href}
        className={cn(
          "block rounded-md px-3 py-2 text-sm transition",
          active ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"
        )}
      >
        {link.label}
      </Link>
    );
  };

  return (
    <aside className="hidden w-64 shrink-0 border-r border-border/70 p-4 lg:block">
      <nav className="space-y-1">{links.map(item)}</nav>
      {isAdmin ? (
        <>
          <p className="mb-1 mt-6 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Admin</p>
          <nav className="space-y-1">{adminLinks.map(item)}</nav>
        </>
      ) : null}
    </aside>
  );
}

/** Phones and tablets: the same links as a scrollable strip above the page. */
export function MobileNav({ isAdmin }: { isAdmin: boolean }) {
  const pathname = usePathname();
  const all = isAdmin ? [...links, { href: "/admin", label: "Admin" }] : links;

  return (
    <nav aria-label="Learning" className="flex gap-2 overflow-x-auto border-b border-border/70 px-4 py-3 lg:hidden">
      {all.map((link) => {
        const active = pathname === link.href || pathname.startsWith(`${link.href}/`);
        return (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "shrink-0 rounded-full border px-3 py-1.5 text-sm",
              active ? "border-primary bg-primary/15 text-foreground" : "border-border text-muted-foreground"
            )}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
