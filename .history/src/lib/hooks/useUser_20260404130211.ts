"use client";

import { useQuery } from "@tanstack/react-query";

import { createClient } from "@/lib/supabase/client";

export function useUser() {
  return useQuery({
    queryKey: ["user"],
    queryFn: async () => {
      const supabase = createClient();
      const {
        data: { user }
      } = await supabase.auth.getUser();
      return user;
    }
  });
}
