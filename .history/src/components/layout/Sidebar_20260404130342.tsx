import Link from "next/link";

const links = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/courses", label: "Courses" },
  { href: "/library", label: "Library" },
  { href: "/my-progress", label: "My Progress" },
  { href: "/settings", label: "Settings" }
];

export function Sidebar() {
  return (
    <aside className="hidden w-64 shrink-0 border-r border-border/70 p-4 lg:block">
      <nav className="space-y-2">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="block rounded-md px-3 py-2 text-sm text-muted-foreground transition hover:bg-muted hover:text-foreground"
          >
            {link.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
