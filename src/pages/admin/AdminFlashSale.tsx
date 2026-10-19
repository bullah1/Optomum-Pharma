import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Plus, Trash2, X, Save, Zap } from "lucide-react";

const AdminFlashSale = () => {
  const qc = useQueryClient();
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ medicine_id: "", discount_percent: 0, sale_price: "" as string | number, ends_at: "" });

  const { data: flashItems = [] } = useQuery({
    queryKey: ["admin-flash-sale"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("flash_sale_products")
        .select("*, medicines(name, price, image_url)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: medicines = [] } = useQuery({
    queryKey: ["all-medicines-list"],
    queryFn: async () => {
      const { data, error } = await supabase.from("medicines").select("id, name, price").order("name");
      if (error) throw error;
      return data;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("flash_sale_products").insert({
        medicine_id: form.medicine_id,
        discount_percent: form.discount_percent,
        sale_price: form.sale_price ? Number(form.sale_price) : null,
        ends_at: form.ends_at || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-flash-sale"] });
      setAdding(false);
      setForm({ medicine_id: "", discount_percent: 0, sale_price: "", ends_at: "" });
      toast.success("Flash sale product added!");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("flash_sale_products").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-flash-sale"] });
      toast.success("Removed from flash sale");
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap size={20} className="text-accent" />
          <div>
            <h2 className="text-lg font-bold text-foreground">Flash Sale</h2>
            <p className="text-sm text-muted-foreground">Manage flash sale products</p>
          </div>
        </div>
        <Button size="sm" onClick={() => setAdding(true)}>
          <Plus size={16} className="mr-1" /> Add Product
        </Button>
      </div>

      {adding && (
        <div className="bg-card border border-border rounded-2xl p-5 space-y-4 shadow-ios">
          <div className="flex justify-between items-center">
            <h3 className="font-bold">Add to Flash Sale</h3>
            <button onClick={() => setAdding(false)}><X size={18} /></button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <select
              className="border border-border rounded-xl px-3 py-2 text-sm bg-card"
              value={form.medicine_id}
              onChange={(e) => setForm({ ...form, medicine_id: e.target.value })}
            >
              <option value="">Select Product</option>
              {medicines.map((m) => (
                <option key={m.id} value={m.id}>{m.name} — ৳{m.price}</option>
              ))}
            </select>
            <Input type="number" placeholder="Discount %" value={form.discount_percent} onChange={(e) => setForm({ ...form, discount_percent: Number(e.target.value) })} />
            <Input type="number" placeholder="Sale Price (optional)" value={form.sale_price} onChange={(e) => setForm({ ...form, sale_price: e.target.value })} />
            <Input type="datetime-local" placeholder="Ends At" value={form.ends_at} onChange={(e) => setForm({ ...form, ends_at: e.target.value })} />
          </div>
          <Button onClick={() => saveMutation.mutate()} disabled={!form.medicine_id || saveMutation.isPending}>
            <Save size={14} className="mr-1" /> Add to Sale
          </Button>
        </div>
      )}

      <div className="space-y-3">
        {flashItems.map((item: any) => (
          <div key={item.id} className="bg-card border border-border rounded-2xl p-4 flex items-center gap-4 shadow-card">
            {item.medicines?.image_url && (
              <img src={item.medicines.image_url} alt="" className="w-12 h-12 rounded-xl object-contain bg-secondary p-1" />
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-foreground truncate">{item.medicines?.name}</p>
              <p className="text-xs text-muted-foreground">
                {item.discount_percent}% OFF · Sale: ৳{item.sale_price || "Auto"}
                {item.ends_at && ` · Ends: ${new Date(item.ends_at).toLocaleDateString()}`}
              </p>
            </div>
            <Switch
              checked={item.active}
              onCheckedChange={async (v) => {
                await supabase.from("flash_sale_products").update({ active: v }).eq("id", item.id);
                qc.invalidateQueries({ queryKey: ["admin-flash-sale"] });
              }}
            />
            <button onClick={() => deleteMutation.mutate(item.id)} className="p-1.5 rounded-xl hover:bg-destructive/10 text-destructive">
              <Trash2 size={14} />
            </button>
          </div>
        ))}
        {flashItems.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-6">No flash sale products yet.</p>
        )}
      </div>
    </div>
  );
};

export default AdminFlashSale;
