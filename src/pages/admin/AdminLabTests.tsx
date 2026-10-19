import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, X, Loader2 } from "lucide-react";

const inputClass = "w-full px-4 py-3 rounded-2xl border border-border bg-secondary/30 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-muted-foreground/50";

const AdminLabTests = () => {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", name_bn: "", price: "", original_price: "", description: "", category: "general", sample_type: "", report_time: "24 Hours", available: true });

  const { data: tests, isLoading } = useQuery({
    queryKey: ["admin-lab-tests"],
    queryFn: async () => { const { data, error } = await supabase.from("lab_tests").select("*").order("created_at", { ascending: false }); if (error) throw error; return data; },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = { name: form.name, name_bn: form.name_bn || null, price: Number(form.price), original_price: form.original_price ? Number(form.original_price) : null, description: form.description || null, category: form.category || "general", sample_type: form.sample_type || null, report_time: form.report_time || "24 Hours", available: form.available };
      if (editId) { const { error } = await supabase.from("lab_tests").update(payload).eq("id", editId); if (error) throw error; }
      else { const { error } = await supabase.from("lab_tests").insert(payload); if (error) throw error; }
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin-lab-tests"] }); toast.success(editId ? "Test updated" : "Test added"); resetForm(); },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("lab_tests").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin-lab-tests"] }); toast.success("Test deleted"); },
    onError: (e: any) => toast.error(e.message),
  });

  const resetForm = () => { setShowForm(false); setEditId(null); setForm({ name: "", name_bn: "", price: "", original_price: "", description: "", category: "general", sample_type: "", report_time: "24 Hours", available: true }); };
  const startEdit = (t: any) => { setEditId(t.id); setForm({ name: t.name, name_bn: t.name_bn || "", price: String(t.price), original_price: t.original_price ? String(t.original_price) : "", description: t.description || "", category: t.category || "general", sample_type: t.sample_type || "", report_time: t.report_time || "24 Hours", available: t.available }); setShowForm(true); };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{tests?.length ?? 0} lab tests</p>
        <button onClick={() => { resetForm(); setShowForm(true); }} className="gradient-accent text-accent-foreground text-sm font-semibold px-4 py-2 rounded-2xl shadow-ios hover:scale-105 active:scale-95 transition-transform flex items-center gap-1.5">
          <Plus size={16} /> New Test
        </button>
      </div>

      {showForm && (
        <div className="bg-card rounded-2xl shadow-ios p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-foreground">{editId ? "Edit Test" : "New Test"}</h4>
            <button onClick={resetForm} className="p-1.5 rounded-full bg-muted text-muted-foreground hover:text-foreground"><X size={16} /></button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input placeholder="Name (English)" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputClass} required />
            <input placeholder="Name (Bangla)" value={form.name_bn} onChange={(e) => setForm({ ...form, name_bn: e.target.value })} className={inputClass} />
            <input placeholder="Price" type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className={inputClass} required />
            <input placeholder="Original Price" type="number" value={form.original_price} onChange={(e) => setForm({ ...form, original_price: e.target.value })} className={inputClass} />
            <input placeholder="Category (e.g. blood)" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className={inputClass} />
            <input placeholder="Sample Type (e.g. Blood)" value={form.sample_type} onChange={(e) => setForm({ ...form, sample_type: e.target.value })} className={inputClass} />
            <input placeholder="Report Time" value={form.report_time} onChange={(e) => setForm({ ...form, report_time: e.target.value })} className={inputClass} />
            <label className="flex items-center gap-2 text-sm text-foreground px-2">
              <input type="checkbox" checked={form.available} onChange={(e) => setForm({ ...form, available: e.target.checked })} className="rounded" />
              Available
            </label>
          </div>
          <textarea placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} className={`${inputClass} resize-none`} />
          <button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending || !form.name || !form.price} className="gradient-primary text-primary-foreground text-sm font-semibold px-5 py-2.5 rounded-2xl shadow-ios hover:scale-105 active:scale-95 transition-transform disabled:opacity-50 flex items-center gap-1.5">
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
              <th className="px-4 py-3.5 text-muted-foreground font-medium text-xs">Category</th>
              <th className="px-4 py-3.5 text-muted-foreground font-medium text-xs">Price</th>
              <th className="px-4 py-3.5 text-muted-foreground font-medium text-xs">Report</th>
              <th className="px-4 py-3.5 text-muted-foreground font-medium text-xs">Status</th>
              <th className="px-4 py-3.5 text-muted-foreground font-medium text-xs">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center"><Loader2 className="animate-spin mx-auto text-primary" size={24} /></td></tr>
            ) : !tests?.length ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">No lab tests found</td></tr>
            ) : (
              tests.map((t) => (
                <tr key={t.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 font-medium text-foreground">{t.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{t.category}</td>
                  <td className="px-4 py-3 text-foreground font-semibold">৳{t.price}</td>
                  <td className="px-4 py-3 text-muted-foreground">{t.report_time}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-xl ${t.available ? "bg-success/15 text-success" : "bg-muted text-muted-foreground"}`}>
                      {t.available ? "Available" : "Unavailable"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button onClick={() => startEdit(t)} className="p-1.5 rounded-xl hover:bg-secondary transition-colors"><Pencil size={14} /></button>
                      <button onClick={() => { if (confirm("Delete?")) deleteMutation.mutate(t.id); }} className="p-1.5 rounded-xl hover:bg-destructive/10 text-destructive transition-colors"><Trash2 size={14} /></button>
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

export default AdminLabTests;
