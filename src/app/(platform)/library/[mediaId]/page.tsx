import { AudioPlayer } from "@/components/media/AudioPlayer";

export default async function MediaDetailPage({ params }: { params: Promise<{ mediaId: string }> }) {
  const { mediaId } = await params;

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-10">
      <h1 className="text-3xl font-bold">Media Item {mediaId}</h1>
      <p className="mt-2 text-muted-foreground">Streaming through protected endpoint.</p>
      <div className="mt-6">
        <AudioPlayer src={`/api/media/${mediaId}/stream`} />
      </div>
    </div>
  );
}
