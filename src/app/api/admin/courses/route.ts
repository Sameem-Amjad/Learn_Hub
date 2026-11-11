import { NextResponse } from "next/server";

import { createServiceRoleClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/utils/admin-auth";

/** Every course, drafts included, with module and lesson counts: the admin course list. */
export async function GET() {
  const { errorResponse } = await requireAdmin();
  if (errorResponse) {
    return errorResponse;
  }

  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("courses")
    .select("id,title,slug,required_tier,is_published,order_index,updated_at,modules(id,lessons(id))")
    .order("order_index", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  type Row = { id: string; title: string; slug: string; required_tier: string; is_published: boolean; order_index: number; updated_at: string; modules: { id: string; lessons: { id: string }[] }[] };
  return NextResponse.json({
    courses: ((data ?? []) as Row[]).map(({ modules, ...c }) => ({
      ...c,
      module_count: modules.length,
      lesson_count: modules.reduce((n, m) => n + m.lessons.length, 0)
    }))
  });
}
