import { createServiceRoleClient } from "@/lib/supabase/server";

export async function createMediaSignedUrl(path: string, expiresInSeconds = 3600) {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase.storage
    .from("media")
    .createSignedUrl(path, expiresInSeconds);

  if (error || !data?.signedUrl) {
    throw new Error("Failed to create signed URL");
  }

  return data.signedUrl;
}
