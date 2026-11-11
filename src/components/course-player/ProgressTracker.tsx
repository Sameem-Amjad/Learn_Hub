import { ProgressBar } from "@/components/ui/progress";

export function ProgressTracker({ value, completed }: { value: number; completed: boolean }) {
  const pct = completed ? 100 : Math.min(100, Math.round(value));
  return (
    <div className="space-y-1">
      <ProgressBar value={pct} label="Lesson progress" />
      <p className="text-xs text-muted-foreground">{completed ? "Completed" : `${pct}% watched`}</p>
    </div>
  );
}
