import { NextResponse } from "next/server";

import { checkMediaAccess } from "@/lib/utils/access-control";
import { createMediaSignedUrl } from "@/lib/utils/signed-urls";
import { createServiceRoleClient, getCurrentUser } from "@/lib/supabase/server";

export async function GET(_req: Request, { params }: { params: Promise<{ mediaId: string }> }) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { mediaId } = await params;
  const hasMediaAccess = await checkMediaAccess(user.id, mediaId);

  if (!hasMediaAccess) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const supabase = createServiceRoleClient();
  const { data: media } = await supabase
    .from("media_library")
    .select("file_path")
    .eq("id", mediaId)
    .maybeSingle();

  const mediaRecord = media as { file_path: string } | null;

  if (!mediaRecord) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const signedUrl = await createMediaSignedUrl(mediaRecord.file_path, 3600);
  return NextResponse.redirect(signedUrl);
}
