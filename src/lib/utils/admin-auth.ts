import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { createServerSupabaseClient } from "@/lib/supabase/server";

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

  const role = await prisma.userRole.findFirst({
    where: {
      userId: user.id,
      role: {
        name: "admin"
      }
    },
    select: { userId: true }
  });

  const isAdmin = Boolean(role);

  if (!isAdmin) {
    return {
      user: null,
      errorResponse: NextResponse.json({ error: "Forbidden" }, { status: 403 })
    };
  }

  return { user, errorResponse: null };
}

export async function isAdminUser(userId: string): Promise<boolean> {
  const role = await prisma.userRole.findFirst({
    where: {
      userId,
      role: {
        name: "admin"
      }
    },
    select: { userId: true }
  });

  return Boolean(role);
}
