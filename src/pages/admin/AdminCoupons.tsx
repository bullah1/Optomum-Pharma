import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, X, Loader2, Tag } from "lucide-react";

const inputClass = "w-full px-4 py-3 rounded-2xl border border-border bg-secondary/30 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-muted-foreground/50";

const AdminCoupons = () => {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({
    code: "", discount_type: "percentage", discount_value: "", min_order_amount: "0",
    max_discount: "", usage_limit: "", expires_at: "", active: true,
  });

  const { data: coupons, isLoading } = useQuery({
    queryKey: ["admin-coupons"],
    queryFn: async () => {
      const { data, error } = await supabase.from("coupons").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        code: form.code.toUpperCase(),
        discount_type: form.discount_type,
        discount_value: Number(form.discount_value),
        min_order_amount: Number(form.min_order_amount) || 0,
        max_discount: form.max_discount ? Number(form.max_discount) : null,
        usage_limit: form.usage_limit ? Number(form.usage_limit) : null,
        expires_at: form.expires_at || null,
        active: form.active,
      };
      if (editId) {
        const { error } = await supabase.from("coupons").update(payload).eq("id", editId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("coupons").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin-coupons"] }); toast.success(editId ? "Coupon updated" : "Coupon created"); resetForm(); },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("coupons").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin-coupons"] }); toast.success("Coupon deleted"); },
    onError: (e: any) => toast.error(e.message),
  });

  const resetForm = () => {
    setShowForm(false); setEditId(null);
    setForm({ code: "", discount_type: "percentage", discount_value: "", min_order_amount: "0", max_discount: "", usage_limit: "", expires_at: "", active: true });
  };

  const startEdit = (c: any) => {
    setEditId(c.id);
    setForm({
      code: c.code, discount_type: c.discount_type, discount_value: String(c.discount_value),
      min_order_amount: String(c.min_order_amount), max_discount: c.max_discount ? String(c.max_discount) : "",
      usage_limit: c.usage_limit ? String(c.usage_limit) : "",
      expires_at: c.expires_at ? new Date(c.expires_at).toISOString().split("T")[0] : "",
      active: c.active,
    });
    setShowForm(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{coupons?.length ?? 0} coupons</p>
        <button onClick={() => { resetForm(); setShowForm(true); }} className="gradient-accent text-accent-foreground text-sm font-semibold px-4 py-2 rounded-2xl shadow-ios hover:scale-105 active:scale-95 transition-transform flex items-center gap-1.5">
          <Plus size={16} /> New Coupon
        </button>
      </div>

      {showForm && (
        <div className="bg-card rounded-2xl shadow-ios p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-foreground">{editId ? "Edit Coupon" : "New Coupon"}</h4>
            <button onClick={resetForm} className="p-1.5 rounded-full bg-muted text-muted-foreground hover:text-foreground"><X size={16} /></button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input placeholder="Coupon Code (e.g. SAVE20)" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} className={`${inputClass} uppercase`} required />
            <select className={inputClass} value={form.discount_type} onChange={(e) => setForm({ ...form, discount_type: e.target.value })}>
              <option value="percentage">Percentage (%)</option>
              <option value="fixed">Fixed Amount (৳)</option>
            </select>
            <input placeholder={form.discount_type === "percentage" ? "Discount %" : "Discount ৳"} type="number" value={form.discount_value} onChange={(e) => setForm({ ...form, discount_value: e.target.value })} className={inputClass} required />
            <input placeholder="Min Order Amount (৳)" type="number" value={form.min_order_amount} onChange={(e) => setForm({ ...form, min_order_amount: e.target.value })} className={inputClass} />
            {form.discount_type === "percentage" && (
              <input placeholder="Max Discount (৳)" type="number" value={form.max_discount} onChange={(e) => setForm({ ...form, max_discount: e.target.value })} className={inputClass} />
            )}
            <input placeholder="Usage Limit" type="number" value={form.usage_limit} onChange={(e) => setForm({ ...form, usage_limit: e.target.value })} className={inputClass} />
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Expiry Date</label>
              <input type="date" value={form.expires_at} onChange={(e) => setForm({ ...form, expires_at: e.target.value })} className={inputClass} />
            </div>
            <label className="flex items-center gap-2 text-sm text-foreground px-2">
              <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} className="rounded" />
              Active
            </label>
          </div>
          <button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending || !form.code || !form.discount_value} className="gradient-primary text-primary-foreground text-sm font-semibold px-5 py-2.5 rounded-2xl shadow-ios hover:scale-105 active:scale-95 transition-transform disabled:opacity-50 flex items-center gap-1.5">
            {saveMutation.isPending && <Loader2 className="animate-spin" size={16} />}
            {editId ? "Update" : "Create Coupon"}
          </button>
        </div>
      )}

      <div className="bg-card rounded-2xl shadow-ios overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left">
              <th className="px-4 py-3.5 text-muted-foreground font-medium text-xs">Code</th>
              <th className="px-4 py-3.5 text-muted-foreground font-medium text-xs">Discount</th>
              <th className="px-4 py-3.5 text-muted-foreground font-medium text-xs">Min Order</th>
              <th className="px-4 py-3.5 text-muted-foreground font-medium text-xs">Usage</th>
              <th className="px-4 py-3.5 text-muted-foreground font-medium text-xs">Expiry</th>
              <th className="px-4 py-3.5 text-muted-foreground font-medium text-xs">Status</th>
              <th className="px-4 py-3.5 text-muted-foreground font-medium text-xs">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center"><Loader2 className="animate-spin mx-auto text-primary" size={24} /></td></tr>
            ) : !coupons?.length ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">No coupons found</td></tr>
            ) : (
              coupons.map((c) => {
                const expired = c.expires_at && new Date(c.expires_at) < new Date();
                return (
                  <tr key={c.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Tag size={14} className="text-primary" />
                        <span className="font-bold text-foreground">{c.code}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-foreground font-semibold">
                      {c.discount_type === "percentage" ? `${c.discount_value}%` : `৳${c.discount_value}`}
                      {c.max_discount ? <span className="text-xs text-muted-foreground ml-1">(max ৳{c.max_discount})</span> : null}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">৳{c.min_order_amount}</td>
                    <td className="px-4 py-3 text-muted-foreground">{c.used_count}{c.usage_limit ? `/${c.usage_limit}` : ""}</td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">
                      {c.expires_at ? new Date(c.expires_at).toLocaleDateString("en-US") : "No expiry"}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-xl ${
                        expired ? "bg-destructive/15 text-destructive" :
                        c.active ? "bg-success/15 text-success" : "bg-muted text-muted-foreground"
                      }`}>
                        {expired ? "Expired" : c.active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button onClick={() => startEdit(c)} className="p-1.5 rounded-xl hover:bg-secondary transition-colors"><Pencil size={14} /></button>
                        <button onClick={() => { if (confirm("Delete this coupon?")) deleteMutation.mutate(c.id); }} className="p-1.5 rounded-xl hover:bg-destructive/10 text-destructive transition-colors"><Trash2 size={14} /></button>
                      </div>
                    </td>
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

export default AdminCoupons;
