import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Plus, Trash2, Pencil, X, Save } from "lucide-react";

type PromoCard = {
  id: string;
  title: string;
  highlight: string;
  detail: string | null;
  action_text: string;
  action_link: string;
  icon: string;
  bg_class: string;
  sort_order: number;
  active: boolean;
};

const bgOptions = [
  { label: "Primary", value: "bg-gradient-to-br from-primary/6 to-primary/12" },
  { label: "Green", value: "bg-gradient-to-br from-success/6 to-success/12" },
  { label: "Accent", value: "bg-gradient-to-br from-accent/8 to-accent/15" },
  { label: "Red", value: "bg-gradient-to-br from-destructive/6 to-destructive/12" },
  { label: "Mixed", value: "bg-gradient-to-br from-primary/8 to-accent/10" },
];

const AdminPromoCards = () => {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<Partial<PromoCard> | null>(null);

  const { data: cards = [], isLoading } = useQuery({
    queryKey: ["admin-promo-cards"],
    queryFn: async () => {
      const { data, error } = await supabase.from("promo_cards").select("*").order("sort_order");
      if (error) throw error;
      return data as PromoCard[];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (card: Partial<PromoCard>) => {
      if (card.id) {
        const { error } = await supabase.from("promo_cards").update(card).eq("id", card.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("promo_cards").insert(card);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-promo-cards"] });
      setEditing(null);
      toast.success("Promo card saved!");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("promo_cards").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-promo-cards"] });
      toast.success("Deleted!");
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-foreground">Promo Cards</h2>
          <p className="text-sm text-muted-foreground">Homepage promo/offer cards manage করুন</p>
        </div>
        <Button size="sm" onClick={() => setEditing({ title: "", highlight: "", action_text: "", action_link: "/", icon: "🎁", bg_class: bgOptions[0].value, sort_order: cards.length, active: true })}>
          <Plus size={16} className="mr-1" /> Add Card
        </Button>
      </div>

      {editing && (
        <div className="bg-card border border-border rounded-2xl p-5 space-y-4 shadow-ios">
          <div className="flex justify-between items-center">
            <h3 className="font-bold">{editing.id ? "Edit" : "New"} Promo Card</h3>
            <button onClick={() => setEditing(null)}><X size={18} /></button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input placeholder="Title (e.g. UPTO)" value={editing.title || ""} onChange={(e) => setEditing({ ...editing, title: e.target.value })} />
            <Input placeholder="Highlight (e.g. 25% OFF)" value={editing.highlight || ""} onChange={(e) => setEditing({ ...editing, highlight: e.target.value })} />
            <Input placeholder="Detail (optional)" value={editing.detail || ""} onChange={(e) => setEditing({ ...editing, detail: e.target.value })} />
            <Input placeholder="Action Button Text" value={editing.action_text || ""} onChange={(e) => setEditing({ ...editing, action_text: e.target.value })} />
            <Input placeholder="Action Link" value={editing.action_link || ""} onChange={(e) => setEditing({ ...editing, action_link: e.target.value })} />
            <Input placeholder="Icon emoji (e.g. 🧪)" value={editing.icon || ""} onChange={(e) => setEditing({ ...editing, icon: e.target.value })} />
            <select
              className="border border-border rounded-xl px-3 py-2 text-sm bg-card"
              value={editing.bg_class || bgOptions[0].value}
              onChange={(e) => setEditing({ ...editing, bg_class: e.target.value })}
            >
              {bgOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <Input type="number" placeholder="Sort Order" value={editing.sort_order ?? 0} onChange={(e) => setEditing({ ...editing, sort_order: Number(e.target.value) })} />
          </div>
          <Button onClick={() => saveMutation.mutate(editing)} disabled={saveMutation.isPending}>
            <Save size={14} className="mr-1" /> Save
          </Button>
        </div>
      )}

      <div className="space-y-3">
        {cards.map((c) => (
          <div key={c.id} className="bg-card border border-border rounded-2xl p-4 flex items-center gap-4 shadow-card">
            <span className="text-2xl">{c.icon}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-foreground">{c.title} {c.highlight}</p>
              <p className="text-xs text-muted-foreground">{c.action_text} · {c.detail}</p>
            </div>
            <Switch checked={c.active} onCheckedChange={async (v) => { await supabase.from("promo_cards").update({ active: v }).eq("id", c.id); qc.invalidateQueries({ queryKey: ["admin-promo-cards"] }); }} />
            <button onClick={() => setEditing(c)} className="p-1.5 rounded-xl hover:bg-secondary"><Pencil size={14} /></button>
            <button onClick={() => deleteMutation.mutate(c.id)} className="p-1.5 rounded-xl hover:bg-destructive/10 text-destructive"><Trash2 size={14} /></button>
          </div>
        ))}
        {!isLoading && cards.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-6">No promo cards yet.</p>
        )}
      </div>
    </div>
  );
};

export default AdminPromoCards;
