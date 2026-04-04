import { Badge } from "@/components/ui/badge";

export function ProgressTracker({ value }: { value: number }) {
  return (
    <div className="space-y-2">
      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full bg-primary" style={{ width: `${Math.min(100, value)}%` }} />
      </div>
      <Badge>{value}% complete</Badge>
    </div>
  );
}
