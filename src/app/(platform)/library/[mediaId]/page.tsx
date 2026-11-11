import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { AudioPlayer } from "@/components/media/AudioPlayer";
import { EPUBViewer } from "@/components/media/EPUBViewer";
import { PDFViewer } from "@/components/media/PDFViewer";
import { Badge } from "@/components/ui/badge";
import { getMediaItem, getUserTier } from "@/lib/server/learning-data";
import { getCurrentUser } from "@/lib/supabase/server";
import { TIER_LABEL, minutes } from "@/lib/utils/format";
import { hasAccess } from "@/lib/utils/tier-comparison";

export default async function MediaDetailPage({ params }: { params: Promise<{ mediaId: string }> }) {
  const { mediaId } = await params;
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }
  if (!/^[0-9a-f-]{36}$/i.test(mediaId)) {
    notFound();
  }

  const [item, tier] = await Promise.all([getMediaItem(mediaId), getUserTier(user.id)]);
  if (!item) {
    notFound();
  }

  const open = Boolean(tier && hasAccess(tier, item.required_tier));
  const stream = `/api/media/${item.id}/stream`;
  const download = `/api/media/${item.id}/download`;

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-10">
      <Link href="/library" className="text-sm text-muted-foreground hover:text-foreground">← Library</Link>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <h1 className="text-3xl font-bold">{item.title}</h1>
        <Badge>{TIER_LABEL[item.required_tier]}</Badge>
      </div>
      {item.description ? <p className="mt-2 max-w-3xl text-muted-foreground">{item.description}</p> : null}
      <p className="mt-1 text-sm text-muted-foreground">
        {item.type === "audio" ? `Audio · ${minutes(item.duration)}` : `${item.type.toUpperCase()}${item.pages ? ` · ${item.pages} pages` : ""}`}
      </p>

      <div className="mt-6">
        {!open ? (
          <div className="rounded-xl border border-border p-6">
            <p className="font-medium">This needs the {TIER_LABEL[item.required_tier]} plan or higher.</p>
            <p className="mt-1 text-sm text-muted-foreground">The file stays in private storage and is only served to plans that include it.</p>
            <Link href="/pricing" className="mt-3 inline-block text-sm font-medium text-primary underline">See plans</Link>
          </div>
        ) : item.type === "audio" ? (
          <AudioPlayer src={stream} />
        ) : item.type === "pdf" ? (
          <PDFViewer url={stream} downloadUrl={download} />
        ) : (
          <EPUBViewer url={download} />
        )}
      </div>
    </div>
  );
}
