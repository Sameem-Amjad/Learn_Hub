export function EPUBViewer({ url }: { url: string }) {
  return (
    <div className="rounded-xl border border-border p-6">
      <p className="font-medium">EPUB e-book</p>
      <p className="mt-1 text-sm text-muted-foreground">Open it in Apple Books, Google Play Books or any e-reader app.</p>
      <a href={url} className="mt-3 inline-block text-sm font-medium text-primary underline">
        Download the EPUB
      </a>
    </div>
  );
}
