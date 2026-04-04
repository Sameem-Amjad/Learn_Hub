export default function Loading() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-20">
      <div className="h-8 w-64 animate-pulse rounded bg-muted" />
      <div className="mt-4 h-4 w-full animate-pulse rounded bg-muted" />
      <div className="mt-2 h-4 w-5/6 animate-pulse rounded bg-muted" />
    </div>
  );
}
