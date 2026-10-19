import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, X, Loader2, Sparkles } from "lucide-react";

const inputClass = "w-full px-4 py-3 rounded-2xl border border-border bg-secondary/30 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-muted-foreground/50";

const AdminBeautySpecialists = () => {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", specialization: "", fee: "", schedule: "", image_url: "", available: true });

  const { data: specialists, isLoading } = useQuery({
    queryKey: ["admin-beauty-specialists"],
    queryFn: async () => {
      const { data, error } = await supabase.from("beauty_specialists").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = { name: form.name, specialization: form.specialization || null, fee: Number(form.fee), schedule: form.schedule || null, image_url: form.image_url || null, available: form.available };
      if (editId) { const { error } = await supabase.from("beauty_specialists").update(payload).eq("id", editId); if (error) throw error; }
      else { const { error } = await supabase.from("beauty_specialists").insert(payload); if (error) throw error; }
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin-beauty-specialists"] }); toast.success(editId ? "Specialist updated" : "Specialist added"); resetForm(); },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("beauty_specialists").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin-beauty-specialists"] }); toast.success("Specialist deleted"); },
    onError: (e: any) => toast.error(e.message),
  });

  const resetForm = () => { setForm({ name: "", specialization: "", fee: "", schedule: "", image_url: "", available: true }); setEditId(null); setShowForm(false); };

  const startEdit = (s: any) => {
    setForm({ name: s.name, specialization: s.specialization || "", fee: String(s.fee), schedule: s.schedule || "", image_url: s.image_url || "", available: s.available });
    setEditId(s.id);
    setShowForm(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-foreground">Beauty Specialists</h1>
          <p className="text-xs text-muted-foreground">{specialists?.length || 0} specialists</p>
        </div>
        <button onClick={() => { resetForm(); setShowForm(true); }} className="flex items-center gap-2 bg-primary text-primary-foreground text-sm font-bold px-4 py-2.5 rounded-xl active:scale-95 transition-transform">
          <Plus size={16} /> Add Specialist
        </button>
      </div>

      {showForm && (
        <div className="bg-card border border-border rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm">{editId ? "Edit" : "Add"} Specialist</h3>
            <button onClick={resetForm} className="p-1.5 rounded-xl hover:bg-secondary"><X size={16} /></button>
          </div>
          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Name *" className={inputClass} />
          <input value={form.specialization} onChange={(e) => setForm({ ...form, specialization: e.target.value })} placeholder="Specialization (e.g. Skin Care, Hair)" className={inputClass} />
          <div className="grid grid-cols-2 gap-3">
            <input value={form.fee} onChange={(e) => setForm({ ...form, fee: e.target.value.replace(/\D/g, "") })} placeholder="Fee (৳)" className={inputClass} />
            <input value={form.schedule} onChange={(e) => setForm({ ...form, schedule: e.target.value })} placeholder="Schedule" className={inputClass} />
          </div>
          <input value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} placeholder="Image URL" className={inputClass} />
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.available} onChange={(e) => setForm({ ...form, available: e.target.checked })} className="rounded" />
            Available
          </label>
          <button onClick={() => saveMutation.mutate()} disabled={!form.name || !form.fee || saveMutation.isPending}
            className="w-full bg-primary text-primary-foreground font-bold py-3 rounded-xl disabled:opacity-50 flex items-center justify-center gap-2">
            {saveMutation.isPending && <Loader2 size={14} className="animate-spin" />}
            {editId ? "Update" : "Add"} Specialist
          </button>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="animate-spin text-primary" size={24} /></div>
      ) : !specialists?.length ? (
        <div className="text-center py-12 text-muted-foreground">
          <Sparkles size={40} className="mx-auto mb-3 opacity-30" />
          <p>No specialists yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {specialists.map((s: any) => (
            <div key={s.id} className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/8 flex items-center justify-center shrink-0 overflow-hidden">
                {s.image_url ? <img src={s.image_url} alt={s.name} className="w-full h-full object-cover" /> : <Sparkles size={18} className="text-primary" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-foreground">{s.name}</p>
                <p className="text-xs text-muted-foreground">{s.specialization || "General"} • ৳{s.fee}</p>
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${s.available ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"}`}>
                {s.available ? "Active" : "Inactive"}
              </span>
              <button onClick={() => startEdit(s)} className="p-2 rounded-xl hover:bg-secondary"><Pencil size={14} /></button>
              <button onClick={() => { if (confirm("Delete this specialist?")) deleteMutation.mutate(s.id); }} className="p-2 rounded-xl hover:bg-destructive/10 text-destructive"><Trash2 size={14} /></button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminBeautySpecialists;
