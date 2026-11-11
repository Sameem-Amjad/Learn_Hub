import type { User } from "@supabase/supabase-js";

import { createServiceRoleClient } from "@/lib/supabase/server";

/**
 * Make sure a signed-in user has a LearnHub profile. Sign-ups made here get
 * one from the database trigger; this covers accounts created elsewhere on a
 * shared Supabase project, which sign in here for the first time.
 */
export async function ensureProfile(user: User) {
  const supabase = createServiceRoleClient();
  const { data } = await supabase.from("users").select("id").eq("id", user.id).maybeSingle();
  if (data) return;

  await supabase.from("users").upsert(
    { id: user.id, email: user.email ?? "", full_name: (user.user_metadata?.full_name as string | undefined) ?? null },
    { onConflict: "id", ignoreDuplicates: true }
  );
  const { data: member } = await supabase.from("roles").select("id").eq("name", "member").maybeSingle();
  if (member) {
    await supabase.from("user_roles").upsert({ user_id: user.id, role_id: (member as { id: number }).id }, { onConflict: "user_id,role_id", ignoreDuplicates: true });
  }
}
