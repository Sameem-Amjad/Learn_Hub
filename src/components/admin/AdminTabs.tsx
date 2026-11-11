"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils/cn";

const TABS = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/users", label: "Users and plans" },
  { href: "/admin/roles", label: "Roles" },
  { href: "/admin/courses", label: "Courses" }
];

export function AdminTabs() {
  const pathname = usePathname();
  return (
    <nav aria-label="Admin" className="flex gap-2 overflow-x-auto border-b border-border pb-3">
      {TABS.map((t) => (
        <Link
          key={t.href}
          href={t.href}
          aria-current={pathname === t.href ? "page" : undefined}
          className={cn(
            "shrink-0 rounded-full border px-3 py-1.5 text-sm",
            pathname === t.href ? "border-primary bg-primary/15 text-foreground" : "border-border text-muted-foreground hover:text-foreground"
          )}
        >
          {t.label}
        </Link>
      ))}
    </nav>
  );
}
