import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Loader2, GripVertical, Lightbulb } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";

interface HealthTip {
  id: string;
  title: string;
  description: string;
  icon: string;
  active: boolean;
  sort_order: number;
  created_at: string;
}

const AdminHealthTips = () => {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<HealthTip | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", icon: "💡", sort_order: 0 });

  const { data: tips = [], isLoading } = useQuery({
    queryKey: ["admin-health-tips"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("health_tips")
        .select("*")
        .order("sort_order");
      if (error) throw error;
      return data as HealthTip[];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (tip: typeof form & { id?: string }) => {
      if (tip.id) {
        const { error } = await supabase.from("health_tips").update({
          title: tip.title,
          description: tip.description,
          icon: tip.icon,
          sort_order: tip.sort_order,
        }).eq("id", tip.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("health_tips").insert({
          title: tip.title,
          description: tip.description,
          icon: tip.icon,
          sort_order: tip.sort_order,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-health-tips"] });
      toast.success(editing ? "Tip updated!" : "Tip added!");
      resetForm();
    },
    onError: (e: any) => toast.error(e.message),
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const { error } = await supabase.from("health_tips").update({ active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-health-tips"] }),
    onError: (e: any) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("health_tips").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-health-tips"] });
      toast.success("Tip deleted!");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const resetForm = () => {
    setEditing(null);
    setIsAdding(false);
    setForm({ title: "", description: "", icon: "💡", sort_order: 0 });
  };

  const startEdit = (tip: HealthTip) => {
    setEditing(tip);
    setIsAdding(true);
    setForm({ title: tip.title, description: tip.description, icon: tip.icon, sort_order: tip.sort_order });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return toast.error("Title is required");
    saveMutation.mutate({ ...form, id: editing?.id });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="animate-spin text-primary" size={28} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Lightbulb size={20} className="text-primary" />
          <h3 className="font-bold text-foreground">Health Tips ({tips.length})</h3>
        </div>
        {!isAdding && (
          <button
            onClick={() => { setIsAdding(true); setEditing(null); setForm({ title: "", description: "", icon: "💡", sort_order: tips.length }); }}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold gradient-primary text-primary-foreground rounded-2xl shadow-ios hover:scale-105 active:scale-95 transition-all"
          >
            <Plus size={14} /> Add Tip
          </button>
        )}
      </div>

      {/* Add/Edit Form */}
      {isAdding && (
        <form onSubmit={handleSubmit} className="bg-card rounded-2xl shadow-ios p-4 space-y-3">
          <h4 className="text-sm font-bold text-foreground">{editing ? "Edit Tip" : "New Health Tip"}</h4>
          <div className="grid grid-cols-[60px_1fr] gap-3">
            <div>
              <label className="text-[10px] text-muted-foreground mb-1 block">Icon</label>
              <Input
                value={form.icon}
                onChange={(e) => setForm({ ...form, icon: e.target.value })}
                className="h-10 text-center text-lg rounded-xl"
                maxLength={4}
              />
            </div>
            <div>
              <label className="text-[10px] text-muted-foreground mb-1 block">Title</label>
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Health tip title"
                className="h-10 rounded-xl text-sm"
                required
              />
            </div>
          </div>
          <div>
            <label className="text-[10px] text-muted-foreground mb-1 block">Description</label>
            <Input
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Short description"
              className="h-10 rounded-xl text-sm"
            />
          </div>
          <div className="w-24">
            <label className="text-[10px] text-muted-foreground mb-1 block">Sort Order</label>
            <Input
              type="number"
              value={form.sort_order}
              onChange={(e) => setForm({ ...form, sort_order: parseInt(e.target.value) || 0 })}
              className="h-10 rounded-xl text-sm"
            />
          </div>
          <div className="flex gap-2 pt-1">
            <button
              type="submit"
              disabled={saveMutation.isPending}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold gradient-accent text-accent-foreground rounded-xl shadow-ios disabled:opacity-50"
            >
              {saveMutation.isPending && <Loader2 className="animate-spin" size={14} />}
              {editing ? "Update" : "Save"}
            </button>
            <button type="button" onClick={resetForm} className="px-4 py-2 text-xs font-medium text-muted-foreground bg-secondary rounded-xl">
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* List */}
      <div className="bg-card rounded-2xl shadow-ios overflow-hidden divide-y divide-border/40">
        {tips.length === 0 && (
          <p className="text-center text-sm text-muted-foreground py-8">No health tips yet</p>
        )}
        {tips.map((tip) => (
          <div key={tip.id} className="flex items-center gap-3 px-4 py-3">
            <GripVertical size={14} className="text-muted-foreground/40 shrink-0" />
            <span className="text-xl shrink-0">{tip.icon}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{tip.title}</p>
              <p className="text-[11px] text-muted-foreground truncate">{tip.description}</p>
            </div>
            <Switch
              checked={tip.active}
              onCheckedChange={(active) => toggleMutation.mutate({ id: tip.id, active })}
              className="shrink-0"
            />
            <button onClick={() => startEdit(tip)} className="p-1.5 rounded-lg hover:bg-secondary transition-colors">
              <Pencil size={14} className="text-muted-foreground" />
            </button>
            <button
              onClick={() => { if (confirm("Delete this tip?")) deleteMutation.mutate(tip.id); }}
              className="p-1.5 rounded-lg hover:bg-destructive/10 transition-colors"
            >
              <Trash2 size={14} className="text-destructive" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminHealthTips;
