import { NextResponse } from "next/server";

import { createServerSupabaseClient } from "@/lib/supabase/server";

function getAdminEmails(): string[] {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export async function requireAdmin() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user?.email) {
    return {
      user: null,
      errorResponse: NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    };
  }

  const admins = getAdminEmails();
  const isAdmin = admins.includes(user.email.toLowerCase());

  if (!isAdmin) {
    return {
      user: null,
      errorResponse: NextResponse.json({ error: "Forbidden" }, { status: 403 })
    };
  }

  return { user, errorResponse: null };
}
