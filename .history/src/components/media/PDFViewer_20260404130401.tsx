export function PDFViewer({ url }: { url: string }) {
  return <iframe src={url} className="h-[75vh] w-full rounded-xl border border-border" title="PDF Viewer" />;
}
