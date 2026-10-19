import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Plus, Pencil, Trash2, Building2, X, Check } from "lucide-react";

interface LabForm {
  name: string;
  logo: string;
  address: string;
  active: boolean;
  sort_order: number;
}

const emptyForm: LabForm = { name: "", logo: "🏥", address: "", active: true, sort_order: 0 };

const AdminDiagnosticLabs = () => {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<LabForm>(emptyForm);

  const { data: labs, isLoading } = useQuery({
    queryKey: ["admin-diagnostic-labs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("diagnostic_labs")
        .select("*")
        .order("sort_order");
      if (error) throw error;
      return data;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (editingId) {
        const { error } = await supabase
          .from("diagnostic_labs")
          .update(form as any)
          .eq("id", editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("diagnostic_labs")
          .insert(form as any);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-diagnostic-labs"] });
      toast.success(editingId ? "Lab updated" : "Lab added");
      resetForm();
    },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("diagnostic_labs").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-diagnostic-labs"] });
      toast.success("Lab deleted");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(false);
  };

  const startEdit = (lab: any) => {
    setForm({ name: lab.name, logo: lab.logo || "🏥", address: lab.address || "", active: lab.active, sort_order: lab.sort_order });
    setEditingId(lab.id);
    setShowForm(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{labs?.length ?? 0} diagnostic labs</p>
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          className="flex items-center gap-1.5 bg-primary text-primary-foreground text-xs font-bold px-4 py-2.5 rounded-2xl active:scale-95 transition-transform"
        >
          <Plus size={14} /> Add Lab
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-card rounded-2xl shadow-ios border border-border p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-foreground">{editingId ? "Edit Lab" : "Add New Lab"}</h3>
            <button onClick={resetForm} className="p-1.5 rounded-xl hover:bg-secondary">
              <X size={16} className="text-muted-foreground" />
            </button>
          </div>
          <div className="grid grid-cols-[60px_1fr] gap-3">
            <div>
              <label className="text-[10px] text-muted-foreground font-medium mb-1 block">Logo</label>
              <input
                value={form.logo}
                onChange={(e) => setForm({ ...form, logo: e.target.value })}
                className="w-full text-center text-2xl px-2 py-2 rounded-xl border border-border bg-secondary/30 outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div>
              <label className="text-[10px] text-muted-foreground font-medium mb-1 block">Name *</label>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Lab name"
                className="w-full px-3 py-2.5 rounded-xl border border-border bg-secondary/30 text-sm outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>
          <div>
            <label className="text-[10px] text-muted-foreground font-medium mb-1 block">Address</label>
            <input
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              placeholder="Address"
              className="w-full px-3 py-2.5 rounded-xl border border-border bg-secondary/30 text-sm outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-[10px] text-muted-foreground font-medium mb-1 block">Sort Order</label>
              <input
                type="number"
                value={form.sort_order}
                onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) })}
                className="w-full px-3 py-2.5 rounded-xl border border-border bg-secondary/30 text-sm outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div className="flex items-end pb-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.active}
                  onChange={(e) => setForm({ ...form, active: e.target.checked })}
                  className="rounded"
                />
                <span className="text-xs text-foreground font-medium">Active</span>
              </label>
            </div>
          </div>
          <button
            onClick={() => saveMutation.mutate()}
            disabled={!form.name || saveMutation.isPending}
            className="w-full py-2.5 bg-primary text-primary-foreground text-sm font-bold rounded-xl disabled:opacity-50 flex items-center justify-center gap-2 active:scale-95 transition-transform"
          >
            {saveMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
            {editingId ? "Update" : "Add"} Lab
          </button>
        </div>
      )}

      {/* List */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="animate-spin text-primary" size={28} />
        </div>
      ) : !labs?.length ? (
        <div className="bg-card rounded-2xl shadow-ios p-8 text-center text-muted-foreground">
          No diagnostic labs found
        </div>
      ) : (
        <div className="bg-card rounded-2xl shadow-ios border border-border overflow-hidden divide-y divide-border/30">
          {labs.map((lab: any) => (
            <div key={lab.id} className="flex items-center gap-3 px-4 py-3.5">
              <span className="text-2xl">{lab.logo}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground">{lab.name}</p>
                <p className="text-[11px] text-muted-foreground">{lab.address || "—"}</p>
              </div>
              {!lab.active && (
                <span className="text-[9px] font-bold text-muted-foreground bg-muted px-2 py-0.5 rounded-full">Inactive</span>
              )}
              <button onClick={() => startEdit(lab)} className="p-2 rounded-xl hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors">
                <Pencil size={14} />
              </button>
              <button
                onClick={() => { if (confirm("Delete this lab?")) deleteMutation.mutate(lab.id); }}
                className="p-2 rounded-xl hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminDiagnosticLabs;
