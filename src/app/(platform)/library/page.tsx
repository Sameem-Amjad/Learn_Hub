import Link from "next/link";
import { redirect } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { getMediaLibrary, getUserTier } from "@/lib/server/learning-data";
import { getCurrentUser } from "@/lib/supabase/server";
import { TIER_LABEL, minutes } from "@/lib/utils/format";
import { hasAccess } from "@/lib/utils/tier-comparison";

const TYPE_LABEL = { pdf: "PDF", epub: "EPUB", audio: "Audio" } as const;

export default async function LibraryPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const [items, tier] = await Promise.all([getMediaLibrary(), getUserTier(user.id)]);

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-10">
      <h1 className="text-3xl font-bold">Media library</h1>
      <p className="mt-2 text-muted-foreground">Handbooks, audio sessions and e-books. Files open through short-lived links once your plan covers them.</p>
      <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => {
          const open = Boolean(tier && hasAccess(tier, item.required_tier));
          return (
            <Link
              key={item.id}
              href={`/library/${item.id}`}
              className="group flex overflow-hidden rounded-xl border border-border bg-card transition hover:border-primary/60"
            >
              {item.cover_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={item.cover_url} alt="" className="w-28 shrink-0 object-cover" />
              ) : null}
              <div className="flex flex-1 flex-col gap-2 p-4">
                <div className="flex flex-wrap gap-2">
                  <Badge>{TYPE_LABEL[item.type]}</Badge>
                  {open ? null : <Badge className="bg-muted text-muted-foreground">{TIER_LABEL[item.required_tier]} plan</Badge>}
                </div>
                <p className="font-semibold">{item.title}</p>
                <p className="text-xs text-muted-foreground">
                  {item.type === "audio" ? minutes(item.duration) : item.pages ? `${item.pages} pages` : ""}
                </p>
                <span className="mt-auto text-sm text-primary">{open ? (item.type === "audio" ? "Listen" : "Read") : "See what unlocks it"}</span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
