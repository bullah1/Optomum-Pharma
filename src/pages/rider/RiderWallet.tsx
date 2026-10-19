import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2, ArrowUpCircle, ArrowDownCircle } from "lucide-react";
import { format } from "date-fns";

const RiderWallet = () => {
  const { user } = useAuth();

  const { data: wallet, isLoading: wLoading } = useQuery({
    queryKey: ["rider-wallet", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("rider_wallets").select("*").eq("rider_id", user!.id).maybeSingle();
      return data;
    },
  });

  const { data: txns, isLoading: tLoading } = useQuery({
    queryKey: ["rider-wallet-txns", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("rider_wallet_transactions")
        .select("*")
        .eq("rider_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data;
    },
  });

  if (wLoading || tLoading) return <div className="flex justify-center py-12"><Loader2 className="animate-spin text-primary" size={28} /></div>;

  return (
    <div className="space-y-6">
      <div className="bg-card rounded-2xl shadow-ios p-6 text-center">
        <p className="text-sm text-muted-foreground">Current Balance</p>
        <p className="text-4xl font-bold text-primary mt-1">৳{wallet?.balance || 0}</p>
        <div className="flex justify-center gap-6 mt-4 text-sm">
          <div><span className="text-muted-foreground">Total Earned:</span> <span className="font-bold text-foreground">৳{wallet?.total_earned || 0}</span></div>
          <div><span className="text-muted-foreground">Deposited:</span> <span className="font-bold text-foreground">৳{wallet?.total_deposited || 0}</span></div>
        </div>
      </div>

      <div>
        <h3 className="font-bold text-foreground mb-3">Transaction History</h3>
        {!txns?.length ? (
          <div className="bg-card rounded-2xl shadow-ios p-6 text-center text-muted-foreground">No transactions yet</div>
        ) : (
          <div className="space-y-2">
            {txns.map((t: any) => (
              <div key={t.id} className="bg-card rounded-2xl shadow-ios p-4 flex items-center gap-3">
                {t.type === "credit" ? (
                  <ArrowDownCircle size={20} className="text-emerald-500 shrink-0" />
                ) : (
                  <ArrowUpCircle size={20} className="text-red-500 shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{t.description || t.type}</p>
                  <p className="text-[10px] text-muted-foreground">{format(new Date(t.created_at), "dd MMM yyyy, hh:mm a")}</p>
                </div>
                <p className={`text-sm font-bold ${t.type === "credit" ? "text-emerald-500" : "text-red-500"}`}>
                  {t.type === "credit" ? "+" : "-"}৳{t.amount}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default RiderWallet;
