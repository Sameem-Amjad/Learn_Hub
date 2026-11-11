import { createServiceRoleClient } from "@/lib/supabase/server";

type Json = string | number | boolean | null | Json[] | { [key: string]: Json };

export async function writeAdminAuditLog(input: {
  actorUserId?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  metadata?: Json;
}) {
  const supabase = createServiceRoleClient();
  const { error } = await supabase.from("admin_audit_logs").insert({
    actor_user_id: input.actorUserId ?? null,
    action: input.action,
    entity_type: input.entityType,
    entity_id: input.entityId ?? null,
    metadata: input.metadata ?? {}
  });

  if (error) {
    // The action itself already happened; a missing log line must not undo it.
    console.error("admin audit log failed", error.message);
  }
}
