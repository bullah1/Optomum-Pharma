import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export const useStockNotify = (medicineIds: string[]) => {
  const { user } = useAuth();
  const [subscribedIds, setSubscribedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!user || medicineIds.length === 0) return;
    supabase
      .from("stock_notifications")
      .select("medicine_id")
      .eq("user_id", user.id)
      .eq("notified", false)
      .in("medicine_id", medicineIds)
      .then(({ data }) => {
        setSubscribedIds(new Set((data || []).map((r: any) => r.medicine_id)));
      });
  }, [user, medicineIds.join(",")]);

  const toggleNotify = useCallback(
    async (medicineId: string) => {
      if (!user) {
        toast.error("Notify পেতে লগইন করুন");
        return;
      }
      const isSubscribed = subscribedIds.has(medicineId);
      // Optimistic
      setSubscribedIds((prev) => {
        const next = new Set(prev);
        if (isSubscribed) next.delete(medicineId);
        else next.add(medicineId);
        return next;
      });

      if (isSubscribed) {
        const { error } = await supabase
          .from("stock_notifications")
          .delete()
          .eq("user_id", user.id)
          .eq("medicine_id", medicineId);
        if (error) {
          setSubscribedIds((prev) => new Set(prev).add(medicineId));
          toast.error("Failed to unsubscribe");
        } else {
          toast.success("Notify বাতিল হয়েছে");
        }
      } else {
        const { error } = await supabase
          .from("stock_notifications")
          .insert({ user_id: user.id, medicine_id: medicineId });
        if (error) {
          setSubscribedIds((prev) => {
            const next = new Set(prev);
            next.delete(medicineId);
            return next;
          });
          toast.error("Failed to subscribe");
        } else {
          toast.success("স্টকে আসলে আপনাকে জানানো হবে");
        }
      }
    },
    [user, subscribedIds]
  );

  return { subscribedIds, isSubscribed: (id: string) => subscribedIds.has(id), toggleNotify };
};
