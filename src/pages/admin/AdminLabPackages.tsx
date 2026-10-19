import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, X, Loader2 } from "lucide-react";

const inputClass = "w-full px-4 py-3 rounded-2xl border border-border bg-secondary/30 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-muted-foreground/50";

const defaultForm = {
  name: "", tests: "", original_price: "", price: "", icon: "Shield",
  gradient: "from-primary/10 to-primary/5", border_color: "border-primary/30",
  badge: "", badge_color: "bg-primary text-primary-foreground",
  active: true, sort_order: "0",
};

const AdminLabPackages = () => {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(defaultForm);

  const { data: packages, isLoading } = useQuery({
    queryKey: ["admin-lab-packages"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lab_packages")
        .select("*")
        .order("sort_order");
      if (error) throw error;
      return data;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const testsArray = form.tests.split(",").map((t) => t.trim()).filter(Boolean);
      const payload: any = {
        name: form.name,
        tests: testsArray,
        original_price: Number(form.original_price),
        price: Number(form.price),
        icon: form.icon || "Shield",
        gradient: form.gradient,
        border_color: form.border_color,
        badge: form.badge || "",
        badge_color: form.badge_color,
        active: form.active,
        sort_order: Number(form.sort_order),
      };
      if (editId) {
        const { error } = await supabase.from("lab_packages").update(payload).eq("id", editId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("lab_packages").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-lab-packages"] });
      queryClient.invalidateQueries({ queryKey: ["lab-packages"] });
      toast.success(editId ? "Package updated" : "Package added");
      resetForm();
    },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("lab_packages").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-lab-packages"] });
      queryClient.invalidateQueries({ queryKey: ["lab-packages"] });
      toast.success("Package deleted");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const resetForm = () => {
    setShowForm(false);
    setEditId(null);
    setForm(defaultForm);
  };

  const startEdit = (p: any) => {
    setEditId(p.id);
    setForm({
      name: p.name,
      tests: (p.tests || []).join(", "),
      original_price: String(p.original_price),
      price: String(p.price),
      icon: p.icon || "Shield",
      gradient: p.gradient || "",
      border_color: p.border_color || "",
      badge: p.badge || "",
      badge_color: p.badge_color || "",
      active: p.active,
      sort_order: String(p.sort_order),
    });
    setShowForm(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{packages?.length ?? 0} packages</p>
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          className="gradient-accent text-accent-foreground text-sm font-semibold px-4 py-2 rounded-2xl shadow-ios hover:scale-105 active:scale-95 transition-transform flex items-center gap-1.5"
        >
          <Plus size={16} /> New Package
        </button>
      </div>

      {showForm && (
        <div className="bg-card rounded-2xl shadow-ios p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-foreground">{editId ? "Edit Package" : "New Package"}</h4>
            <button onClick={resetForm} className="p-1.5 rounded-full bg-muted text-muted-foreground hover:text-foreground">
              <X size={16} />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input placeholder="Package Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputClass} required />
            <input placeholder="Icon (e.g. Shield, Heart, Activity)" value={form.icon} onChange={(e) => setForm({ ...form, icon: e.target.value })} className={inputClass} />
            <input placeholder="Price" type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className={inputClass} required />
            <input placeholder="Original Price" type="number" value={form.original_price} onChange={(e) => setForm({ ...form, original_price: e.target.value })} className={inputClass} required />
            <input placeholder="Badge (e.g. Popular, Best Value)" value={form.badge} onChange={(e) => setForm({ ...form, badge: e.target.value })} className={inputClass} />
            <input placeholder="Sort Order" type="number" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: e.target.value })} className={inputClass} />
            <input placeholder="Gradient (e.g. from-primary/10 to-primary/5)" value={form.gradient} onChange={(e) => setForm({ ...form, gradient: e.target.value })} className={inputClass} />
            <input placeholder="Border Color (e.g. border-primary/30)" value={form.border_color} onChange={(e) => setForm({ ...form, border_color: e.target.value })} className={inputClass} />
            <input placeholder="Badge Color (e.g. bg-primary text-primary-foreground)" value={form.badge_color} onChange={(e) => setForm({ ...form, badge_color: e.target.value })} className={inputClass} />
            <label className="flex items-center gap-2 text-sm text-foreground px-2">
              <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} className="rounded" />
              Active
            </label>
          </div>
          <input placeholder="Tests (comma separated, e.g. CBC, HbA1c, Lipid Profile)" value={form.tests} onChange={(e) => setForm({ ...form, tests: e.target.value })} className={inputClass} />
          <button
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending || !form.name || !form.price}
            className="gradient-primary text-primary-foreground text-sm font-semibold px-5 py-2.5 rounded-2xl shadow-ios hover:scale-105 active:scale-95 transition-transform disabled:opacity-50 flex items-center gap-1.5"
          >
            {saveMutation.isPending && <Loader2 className="animate-spin" size={16} />}
            {editId ? "Update" : "Save"}
          </button>
        </div>
      )}

      <div className="bg-card rounded-2xl shadow-ios overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left">
              <th className="px-4 py-3.5 text-muted-foreground font-medium text-xs">Name</th>
              <th className="px-4 py-3.5 text-muted-foreground font-medium text-xs">Tests</th>
              <th className="px-4 py-3.5 text-muted-foreground font-medium text-xs">Price</th>
              <th className="px-4 py-3.5 text-muted-foreground font-medium text-xs">Badge</th>
              <th className="px-4 py-3.5 text-muted-foreground font-medium text-xs">Status</th>
              <th className="px-4 py-3.5 text-muted-foreground font-medium text-xs">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center"><Loader2 className="animate-spin mx-auto text-primary" size={24} /></td></tr>
            ) : !packages?.length ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">No packages found</td></tr>
            ) : (
              packages.map((p) => (
                <tr key={p.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 font-medium text-foreground">{p.name}</td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">{(p.tests || []).length} tests</td>
                  <td className="px-4 py-3">
                    <span className="font-semibold text-foreground">৳{p.price}</span>
                    {p.original_price && <span className="text-xs text-muted-foreground line-through ml-1">৳{p.original_price}</span>}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{p.badge || "—"}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-xl ${p.active ? "bg-success/15 text-success" : "bg-muted text-muted-foreground"}`}>
                      {p.active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button onClick={() => startEdit(p)} className="p-1.5 rounded-xl hover:bg-secondary transition-colors"><Pencil size={14} /></button>
                      <button onClick={() => { if (confirm("Delete this package?")) deleteMutation.mutate(p.id); }} className="p-1.5 rounded-xl hover:bg-destructive/10 text-destructive transition-colors"><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminLabPackages;
