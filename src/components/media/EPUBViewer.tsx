export function EPUBViewer({ url }: { url: string }) {
  return (
    <div className="rounded-xl border border-border p-6">
      <p className="text-sm text-muted-foreground">EPUB file ready:</p>
      <a href={url} className="text-primary underline">
        Open EPUB
      </a>
    </div>
  );
}
