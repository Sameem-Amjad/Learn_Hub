"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";

export function Dialog({
  triggerText,
  title,
  children
}: {
  triggerText: string;
  title: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button variant="secondary" onClick={() => setOpen(true)}>
        {triggerText}
      </Button>
      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className={cn("w-full max-w-lg rounded-xl border border-border bg-card p-6")}> 
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold">{title}</h3>
              <button onClick={() => setOpen(false)} aria-label="Close">
                X
              </button>
            </div>
            {children}
          </div>
        </div>
      ) : null}
    </>
  );
}
