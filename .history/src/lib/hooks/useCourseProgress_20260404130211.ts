"use client";

import { useQuery } from "@tanstack/react-query";

import { createClient } from "@/lib/supabase/client";

export function useCourseProgress(userId?: string) {
  return useQuery({
    queryKey: ["course-progress", userId],
    enabled: Boolean(userId),
    queryFn: async () => {
      const supabase = createClient();
      const { data } = await supabase.from("user_progress").select("*").eq("user_id", userId);
      return data ?? [];
    }
  });
}
