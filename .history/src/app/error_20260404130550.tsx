"use client";

import { useEffect } from "react";

import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto max-w-xl px-4 py-20 text-center">
      <h2 className="text-3xl font-bold">Something went wrong</h2>
      <p className="mt-3 text-muted-foreground">Please try again. If this persists, check logs and monitoring.</p>
      <Button className="mt-6" onClick={() => reset()}>
        Retry
      </Button>
    </div>
  );
}
