import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2, Plus } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

const statusColors: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  approved: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  rejected: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

const RiderDeposits = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [amount, setAmount] = useState("");
  const [showForm, setShowForm] = useState(false);

  const { data: wallet } = useQuery({
    queryKey: ["rider-wallet", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("rider_wallets").select("*").eq("rider_id", user!.id).maybeSingle();
      return data;
    },
  });

  const { data: deposits, isLoading } = useQuery({
    queryKey: ["rider-deposits", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("rider_deposit_requests")
        .select("*")
        .eq("rider_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const createDeposit = useMutation({
    mutationFn: async () => {
      const amt = parseFloat(amount);
      if (!amt || amt <= 0) throw new Error("Invalid amount");
      if (amt > (wallet?.balance || 0)) throw new Error("Amount exceeds wallet balance");

      const { error } = await supabase.from("rider_deposit_requests").insert({ rider_id: user!.id, amount: amt });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rider-deposits"] });
      toast.success("Deposit request submitted!");
      setAmount("");
      setShowForm(false);
    },
    onError: (e: any) => toast.error(e.message),
  });

  if (isLoading) return <div className="flex justify-center py-12"><Loader2 className="animate-spin text-primary" size={28} /></div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Wallet Balance</p>
          <p className="text-2xl font-bold text-primary">৳{wallet?.balance || 0}</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold flex items-center gap-1.5">
          <Plus size={14} /> New Request
        </button>
      </div>

      {showForm && (
        <div className="bg-card rounded-2xl shadow-ios p-4 space-y-3">
          <input type="number" placeholder="Enter amount to deposit" value={amount} onChange={(e) => setAmount(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-border bg-background text-sm outline-none focus:ring-2 focus:ring-primary/20" />
          <button onClick={() => createDeposit.mutate()} disabled={createDeposit.isPending}
            className="w-full py-3 rounded-xl bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-50">
            {createDeposit.isPending ? "Submitting..." : "Submit Deposit Request"}
          </button>
        </div>
      )}

      {!deposits?.length ? (
        <div className="bg-card rounded-2xl shadow-ios p-8 text-center text-muted-foreground">No deposit requests yet</div>
      ) : (
        <div className="space-y-2">
          {deposits.map((d: any) => (
            <div key={d.id} className="bg-card rounded-2xl shadow-ios p-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-foreground">৳{d.amount}</p>
                <p className="text-[10px] text-muted-foreground">{format(new Date(d.created_at), "dd MMM yyyy, hh:mm a")}</p>
                {d.admin_notes && <p className="text-[10px] text-muted-foreground mt-0.5">Note: {d.admin_notes}</p>}
              </div>
              <span className={`px-2.5 py-1 rounded-xl text-[10px] font-bold ${statusColors[d.status] || "bg-secondary text-foreground"}`}>
                {d.status.charAt(0).toUpperCase() + d.status.slice(1)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default RiderDeposits;
