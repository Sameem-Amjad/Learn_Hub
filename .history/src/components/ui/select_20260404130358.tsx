import type { SelectHTMLAttributes } from "react";

import { cn } from "@/lib/utils/cn";

export function Select({ className, children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn("h-10 w-full rounded-md border border-border bg-transparent px-3 py-2 text-sm", className)}
      {...props}
    >
      {children}
    </select>
  );
}
