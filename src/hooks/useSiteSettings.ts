import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type SiteSettings = Record<string, string>;

export const useSiteSettings = () => {
  const queryClient = useQueryClient();

  return useQuery<SiteSettings>({
    queryKey: ["site-settings"],
    queryFn: async () => {
      // If already seeded by homepage bundle, use that
      const cached = queryClient.getQueryData<SiteSettings>(["site-settings"]);
      if (cached && Object.keys(cached).length > 0) return cached;

      // Fallback for non-homepage routes
      const { data, error } = await supabase.from("site_settings").select("key, value");
      if (error) throw error;
      const map: SiteSettings = {};
      data?.forEach((s) => {
        map[s.key] = s.value ?? "";
      });
      return map;
    },
    staleTime: 10 * 60 * 1000,
    // Don't refetch if already have data (seeded by homepage)
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });
};
