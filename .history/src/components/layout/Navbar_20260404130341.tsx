import Link from "next/link";

import { Button } from "@/components/ui/button";

export function Navbar() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4">
        <Link href="/" className="text-xl font-bold tracking-tight text-foreground">
          LearnHub
        </Link>
        <nav className="hidden gap-6 text-sm text-muted-foreground md:flex">
          <Link href="/pricing">Pricing</Link>
          <Link href="/about">About</Link>
          <Link href="/dashboard">Dashboard</Link>
        </nav>
        <div className="flex items-center gap-2">
          <Link href="/login">
            <Button variant="ghost">Login</Button>
          </Link>
          <Link href="/signup">
            <Button>Get Started</Button>
          </Link>
        </div>
      </div>
    </header>
  );
}
