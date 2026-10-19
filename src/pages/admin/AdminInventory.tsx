import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, X, Loader2, Search, ArrowUpCircle, ArrowDownCircle, AlertTriangle, Calendar } from "lucide-react";

const inputClass = "w-full px-4 py-3 rounded-2xl border border-border bg-secondary/30 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-muted-foreground/50";

const AdminInventory = () => {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<"all" | "in" | "out">("all");
  const [form, setForm] = useState({
    medicine_id: "", type: "in", quantity: "", batch_number: "",
    expiry_date: "", purchase_price: "", notes: "",
  });

  const { data: inventory, isLoading } = useQuery({
    queryKey: ["admin-inventory"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("inventory")
        .select("*, medicines(name, price, stock)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: medicines } = useQuery({
    queryKey: ["admin-medicines-list"],
    queryFn: async () => {
      const { data, error } = await supabase.from("medicines").select("id, name, price, stock").order("name");
      if (error) throw error;
      return data;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const qty = Number(form.quantity);
      // Insert inventory record
      const { error } = await supabase.from("inventory").insert({
        medicine_id: form.medicine_id,
        type: form.type,
        quantity: qty,
        batch_number: form.batch_number || null,
        expiry_date: form.expiry_date || null,
        purchase_price: Number(form.purchase_price) || 0,
        notes: form.notes || null,
      });
      if (error) throw error;

      // Update medicine stock
      const medicine = medicines?.find(m => m.id === form.medicine_id);
      if (medicine) {
        const newStock = form.type === "in" ? medicine.stock + qty : Math.max(0, medicine.stock - qty);
        const { error: updateErr } = await supabase.from("medicines").update({ stock: newStock }).eq("id", form.medicine_id);
        if (updateErr) throw updateErr;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-inventory"] });
      queryClient.invalidateQueries({ queryKey: ["admin-medicines-list"] });
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      toast.success(`Stock ${form.type === "in" ? "added" : "removed"} successfully`);
      resetForm();
    },
    onError: (e: any) => toast.error(e.message),
  });

  const resetForm = () => {
    setShowForm(false);
    setForm({ medicine_id: "", type: "in", quantity: "", batch_number: "", expiry_date: "", purchase_price: "", notes: "" });
  };

  const filtered = inventory?.filter(i => {
    if (filterType !== "all" && i.type !== filterType) return false;
    if (search) {
      const s = search.toLowerCase();
      return (i as any).medicines?.name?.toLowerCase().includes(s) || i.batch_number?.toLowerCase().includes(s);
    }
    return true;
  });

  // Expiry alerts — items expiring within 30 days
  const expiringItems = inventory?.filter(i => {
    if (!i.expiry_date) return false;
    const exp = new Date(i.expiry_date);
    const diff = (exp.getTime() - Date.now()) / (1000 * 60 * 60 * 24);
    return diff <= 30 && diff >= 0;
  }) ?? [];

  const expiredItems = inventory?.filter(i => {
    if (!i.expiry_date) return false;
    return new Date(i.expiry_date) < new Date();
  }) ?? [];

  // Profit margin for selected medicine
  const getProfit = (sellPrice: number, purchasePrice: number) => {
    if (!purchasePrice) return null;
    const margin = ((sellPrice - purchasePrice) / sellPrice) * 100;
    return margin.toFixed(1);
  };

  return (
    <div className="space-y-4">
      {/* Alerts */}
      {(expiringItems.length > 0 || expiredItems.length > 0) && (
        <div className="space-y-2">
          {expiredItems.length > 0 && (
            <div className="bg-destructive/10 border border-destructive/30 rounded-2xl p-4 flex items-start gap-3">
              <AlertTriangle size={18} className="text-destructive mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-destructive">Expired Items ({expiredItems.length})</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {expiredItems.slice(0, 3).map(i => `${(i as any).medicines?.name} (Batch: ${i.batch_number || "—"})`).join(", ")}
                  {expiredItems.length > 3 && ` +${expiredItems.length - 3} more`}
                </p>
              </div>
            </div>
          )}
          {expiringItems.length > 0 && (
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 flex items-start gap-3">
              <Calendar size={18} className="text-amber-600 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-amber-700">Expiring Soon ({expiringItems.length})</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {expiringItems.slice(0, 3).map(i => `${(i as any).medicines?.name} — ${new Date(i.expiry_date!).toLocaleDateString("en-US", { day: "numeric", month: "short" })}`).join(", ")}
                  {expiringItems.length > 3 && ` +${expiringItems.length - 3} more`}
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Search, Filter, Add */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input placeholder="Search by product, batch..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-2xl border border-border bg-card text-sm outline-none focus:ring-2 focus:ring-primary/20" />
        </div>
        <div className="flex gap-1.5">
          {(["all", "in", "out"] as const).map(t => (
            <button key={t} onClick={() => setFilterType(t)}
              className={`px-3.5 py-2 rounded-2xl text-xs font-semibold capitalize transition-all ${
                filterType === t ? "bg-primary text-primary-foreground shadow-ios" : "bg-secondary text-muted-foreground"
              }`}>
              {t === "all" ? "All" : t === "in" ? "Stock In" : "Stock Out"}
            </button>
          ))}
        </div>
        <button onClick={() => { resetForm(); setShowForm(true); }}
          className="gradient-accent text-accent-foreground text-sm font-semibold px-4 py-2.5 rounded-2xl shadow-ios hover:scale-105 active:scale-95 transition-transform flex items-center gap-1.5 whitespace-nowrap">
          <Plus size={16} /> Add Entry
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-card rounded-2xl shadow-ios p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-foreground">New Stock Entry</h4>
            <button onClick={resetForm} className="p-1.5 rounded-full bg-muted text-muted-foreground hover:text-foreground"><X size={16} /></button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <select className={inputClass} value={form.medicine_id} onChange={(e) => setForm({ ...form, medicine_id: e.target.value })} required>
              <option value="">Select Product</option>
              {medicines?.map(m => <option key={m.id} value={m.id}>{m.name} (Stock: {m.stock})</option>)}
            </select>
            <select className={inputClass} value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
              <option value="in">Stock In (+)</option>
              <option value="out">Stock Out (−)</option>
            </select>
            <input placeholder="Quantity" type="number" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} className={inputClass} required />
            <input placeholder="Batch Number" value={form.batch_number} onChange={(e) => setForm({ ...form, batch_number: e.target.value })} className={inputClass} />
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Expiry Date</label>
              <input type="date" value={form.expiry_date} onChange={(e) => setForm({ ...form, expiry_date: e.target.value })} className={inputClass} />
            </div>
            <input placeholder="Purchase Price (৳)" type="number" value={form.purchase_price} onChange={(e) => setForm({ ...form, purchase_price: e.target.value })} className={inputClass} />
          </div>
          <input placeholder="Notes (optional)" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className={inputClass} />

          {/* Profit preview */}
          {form.medicine_id && form.purchase_price && (
            <div className="bg-muted/30 rounded-xl px-4 py-2.5 text-xs">
              {(() => {
                const med = medicines?.find(m => m.id === form.medicine_id);
                if (!med) return null;
                const margin = getProfit(Number(med.price), Number(form.purchase_price));
                return (
                  <div className="flex items-center gap-4">
                    <span className="text-muted-foreground">Sell: <strong className="text-foreground">৳{med.price}</strong></span>
                    <span className="text-muted-foreground">Buy: <strong className="text-foreground">৳{form.purchase_price}</strong></span>
                    <span className={`font-bold ${Number(margin) > 0 ? "text-green-600" : "text-destructive"}`}>
                      Margin: {margin}%
                    </span>
                  </div>
                );
              })()}
            </div>
          )}

          <button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending || !form.medicine_id || !form.quantity}
            className="gradient-primary text-primary-foreground text-sm font-semibold px-5 py-2.5 rounded-2xl shadow-ios hover:scale-105 active:scale-95 transition-transform disabled:opacity-50 flex items-center gap-1.5">
            {saveMutation.isPending && <Loader2 className="animate-spin" size={16} />}
            {form.type === "in" ? "Add Stock" : "Remove Stock"}
          </button>
        </div>
      )}

      <p className="text-sm text-muted-foreground">{filtered?.length ?? 0} entries</p>

      {/* Table */}
      <div className="bg-card rounded-2xl shadow-ios overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left">
              <th className="px-4 py-3.5 text-muted-foreground font-medium text-xs">Type</th>
              <th className="px-4 py-3.5 text-muted-foreground font-medium text-xs">Product</th>
              <th className="px-4 py-3.5 text-muted-foreground font-medium text-xs">Qty</th>
              <th className="px-4 py-3.5 text-muted-foreground font-medium text-xs">Batch</th>
              <th className="px-4 py-3.5 text-muted-foreground font-medium text-xs">Expiry</th>
              <th className="px-4 py-3.5 text-muted-foreground font-medium text-xs">Purchase ৳</th>
              <th className="px-4 py-3.5 text-muted-foreground font-medium text-xs">Margin</th>
              <th className="px-4 py-3.5 text-muted-foreground font-medium text-xs">Date</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={8} className="px-4 py-8 text-center"><Loader2 className="animate-spin mx-auto text-primary" size={24} /></td></tr>
            ) : !filtered?.length ? (
              <tr><td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">No inventory entries</td></tr>
            ) : (
              filtered.map((item) => {
                const med = (item as any).medicines;
                const isExpired = item.expiry_date && new Date(item.expiry_date) < new Date();
                const margin = med?.price && item.purchase_price ? getProfit(Number(med.price), Number(item.purchase_price)) : null;
                return (
                  <tr key={item.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3">
                      {item.type === "in" ? (
                        <span className="flex items-center gap-1 text-xs font-semibold text-green-600"><ArrowUpCircle size={14} /> IN</span>
                      ) : (
                        <span className="flex items-center gap-1 text-xs font-semibold text-destructive"><ArrowDownCircle size={14} /> OUT</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-foreground truncate max-w-[180px]">{med?.name || "—"}</p>
                      <p className="text-[10px] text-muted-foreground">Stock: {med?.stock ?? 0}</p>
                    </td>
                    <td className="px-4 py-3 font-semibold text-foreground">{item.quantity}</td>
                    <td className="px-4 py-3 text-muted-foreground font-mono text-xs">{item.batch_number || "—"}</td>
                    <td className="px-4 py-3">
                      {item.expiry_date ? (
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-xl ${
                          isExpired ? "bg-destructive/15 text-destructive" : "text-muted-foreground"
                        }`}>
                          {new Date(item.expiry_date).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "2-digit" })}
                          {isExpired && " ⚠️"}
                        </span>
                      ) : "—"}
                    </td>
                    <td className="px-4 py-3 text-foreground">৳{item.purchase_price}</td>
                    <td className="px-4 py-3">
                      {margin ? (
                        <span className={`text-xs font-bold ${Number(margin) > 0 ? "text-green-600" : "text-destructive"}`}>
                          {margin}%
                        </span>
                      ) : "—"}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">{new Date(item.created_at).toLocaleDateString("en-US", { day: "numeric", month: "short" })}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminInventory;
