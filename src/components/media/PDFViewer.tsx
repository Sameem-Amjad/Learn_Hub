export function PDFViewer({ url, downloadUrl }: { url: string; downloadUrl: string }) {
  return (
    <div className="space-y-3">
      <iframe src={url} className="h-[75vh] w-full rounded-xl border border-border bg-white" title="PDF viewer" />
      <a href={downloadUrl} className="inline-block text-sm text-primary underline">
        Download the PDF
      </a>
    </div>
  );
}
