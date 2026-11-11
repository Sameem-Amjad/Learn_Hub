import { MEDIA_BUCKET } from "@/lib/supabase/schema";
import { createServiceRoleClient } from "@/lib/supabase/server";

/** A short-lived link to a file in the private media bucket. Call it only after the access check. */
export async function createMediaSignedUrl(path: string, expiresInSeconds = 3600) {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase.storage.from(MEDIA_BUCKET).createSignedUrl(path, expiresInSeconds);

  if (error || !data?.signedUrl) {
    throw new Error("Failed to create signed URL");
  }

  return data.signedUrl;
}

/** Lesson videos: a full URL is used as is, a bucket path is signed for two hours. */
export async function lessonVideoUrl(videoUrl: string | null) {
  if (!videoUrl) return null;
  if (/^https?:\/\//.test(videoUrl)) return videoUrl;
  try {
    return await createMediaSignedUrl(videoUrl, 2 * 3600);
  } catch {
    return null;
  }
}
