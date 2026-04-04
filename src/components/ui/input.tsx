import type { InputHTMLAttributes } from "react";

import { cn } from "@/lib/utils/cn";

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "h-10 w-full rounded-md border border-border bg-transparent px-3 py-2 text-sm outline-none ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-primary",
        className
      )}
      {...props}
    />
  );
}
