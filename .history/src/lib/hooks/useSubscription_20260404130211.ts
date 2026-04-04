"use client";

import { useQuery } from "@tanstack/react-query";

import { createClient } from "@/lib/supabase/client";

export function useSubscription(userId?: string) {
  return useQuery({
    queryKey: ["subscription", userId],
    enabled: Boolean(userId),
    queryFn: async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

      return data;
    }
  });
}
