export function AudioPlayer({ src }: { src: string }) {
  return (
    <div className="rounded-xl border border-border p-4">
      <audio controls preload="metadata" className="w-full" src={src}>
        Your browser does not support audio playback.
      </audio>
    </div>
  );
}
