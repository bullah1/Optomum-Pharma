import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Plus, Trash2, GripVertical, Pencil, X, Save } from "lucide-react";

type Banner = {
  id: string;
  title: string;
  subtitle: string;
  highlight: string;
  cta_text: string;
  cta_link: string;
  image_url: string | null;
  sort_order: number;
  active: boolean;
};

const emptyBanner = {
  title: "",
  subtitle: "",
  highlight: "",
  cta_text: "Order Now",
  cta_link: "/",
  image_url: "",
  sort_order: 0,
  active: true,
};

const AdminBanners = () => {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<Partial<Banner> | null>(null);

  const { data: banners = [], isLoading } = useQuery({
    queryKey: ["admin-banners"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("banners")
        .select("*")
        .order("sort_order");
      if (error) throw error;
      return data as Banner[];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (banner: Partial<Banner>) => {
      if (banner.id) {
        const { error } = await supabase.from("banners").update(banner).eq("id", banner.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("banners").insert(banner);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-banners"] });
      setEditing(null);
      toast.success("Banner saved!");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("banners").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-banners"] });
      toast.success("Banner deleted!");
    },
  });

  const toggleActive = async (id: string, active: boolean) => {
    await supabase.from("banners").update({ active }).eq("id", id);
    qc.invalidateQueries({ queryKey: ["admin-banners"] });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-foreground">Hero Banners</h2>
          <p className="text-sm text-muted-foreground">Manage homepage slider banners</p>
        </div>
        <Button onClick={() => setEditing({ ...emptyBanner, sort_order: banners.length })} size="sm">
          <Plus size={16} className="mr-1" /> Add Banner
        </Button>
      </div>

      {/* Edit Form */}
      {editing && (
        <div className="bg-card border border-border rounded-2xl p-5 space-y-4 shadow-ios">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-foreground">{editing.id ? "Edit" : "New"} Banner</h3>
            <button onClick={() => setEditing(null)}><X size={18} /></button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input placeholder="Title" value={editing.title || ""} onChange={(e) => setEditing({ ...editing, title: e.target.value })} />
            <Input placeholder="Subtitle" value={editing.subtitle || ""} onChange={(e) => setEditing({ ...editing, subtitle: e.target.value })} />
            <Input placeholder="Highlight text" value={editing.highlight || ""} onChange={(e) => setEditing({ ...editing, highlight: e.target.value })} />
            <Input placeholder="CTA Button Text" value={editing.cta_text || ""} onChange={(e) => setEditing({ ...editing, cta_text: e.target.value })} />
            <Input placeholder="CTA Link (e.g. /category/abc)" value={editing.cta_link || ""} onChange={(e) => setEditing({ ...editing, cta_link: e.target.value })} />
            <Input placeholder="Image URL" value={editing.image_url || ""} onChange={(e) => setEditing({ ...editing, image_url: e.target.value })} />
            <Input type="number" placeholder="Sort Order" value={editing.sort_order ?? 0} onChange={(e) => setEditing({ ...editing, sort_order: Number(e.target.value) })} />
          </div>
          {editing.image_url && (
            <img src={editing.image_url} alt="Preview" className="h-24 rounded-xl object-cover" />
          )}
          <Button onClick={() => saveMutation.mutate(editing)} disabled={saveMutation.isPending}>
            <Save size={14} className="mr-1" /> Save Banner
          </Button>
        </div>
      )}

      {/* Banner List */}
      <div className="space-y-3">
        {banners.map((b) => (
          <div key={b.id} className="bg-card border border-border rounded-2xl p-4 flex items-center gap-4 shadow-card">
            <GripVertical size={16} className="text-muted-foreground/40" />
            {b.image_url && (
              <img src={b.image_url} alt="" className="w-20 h-14 rounded-xl object-cover bg-secondary" />
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-foreground truncate">{b.title} — {b.highlight}</p>
              <p className="text-xs text-muted-foreground">{b.subtitle} · {b.cta_text}</p>
            </div>
            <Switch checked={b.active} onCheckedChange={(v) => toggleActive(b.id, v)} />
            <button onClick={() => setEditing(b)} className="p-1.5 rounded-xl hover:bg-secondary"><Pencil size={14} /></button>
            <button onClick={() => deleteMutation.mutate(b.id)} className="p-1.5 rounded-xl hover:bg-destructive/10 text-destructive"><Trash2 size={14} /></button>
          </div>
        ))}
        {!isLoading && banners.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-6">No banners yet. Add your first banner!</p>
        )}
      </div>
    </div>
  );
};

export default AdminBanners;
