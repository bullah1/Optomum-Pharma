import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AdminBanners from "./AdminBanners";
import AdminPromoCards from "./AdminPromoCards";
import AdminFlashSale from "./AdminFlashSale";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useState } from "react";
import { GripVertical, Plus, Trash2, Eye, EyeOff, ArrowUp, ArrowDown, ChevronDown, ChevronUp, Palette } from "lucide-react";
import ProductPicker from "@/components/admin/ProductPicker";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const SECTION_TYPES = [
  { value: "banner", label: "Hero Banner" },
  { value: "category_grid", label: "Category Grid" },
  { value: "quick_actions", label: "Quick Actions" },
  { value: "promo_cards", label: "Promo Cards" },
  { value: "flash_sale", label: "Flash Sale" },
  { value: "featured_products", label: "Featured Products" },
  { value: "custom_products", label: "Custom Product Slider" },
  { value: "ai_trending", label: "AI Trending Products" },
];

const CategoryOptions = () => {
  const { data: categories = [] } = useQuery({
    queryKey: ["admin-categories-list"],
    queryFn: async () => {
      const { data, error } = await supabase.from("categories").select("id,name").order("name");
      if (error) throw error;
      return data;
    },
  });
  return (
    <>
      {categories.map((cat: any) => (
        <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
      ))}
    </>
  );
};

const SectionBuilder = () => {
  const qc = useQueryClient();
  const [newType, setNewType] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);

  const { data: sections = [], isLoading } = useQuery({
    queryKey: ["admin-homepage-sections"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("homepage_sections")
        .select("*")
        .order("sort_order");
      if (error) throw error;
      return data;
    },
  });

  const refresh = () => qc.invalidateQueries({ queryKey: ["admin-homepage-sections"] });

  const toggleActive = async (id: string, active: boolean) => {
    await supabase.from("homepage_sections").update({ active }).eq("id", id);
    refresh();
    toast.success(active ? "Section visible" : "Section hidden");
  };

  const moveSection = async (id: string, direction: "up" | "down") => {
    const idx = sections.findIndex((s: any) => s.id === id);
    if (idx < 0) return;
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= sections.length) return;

    const currentOrder = sections[idx].sort_order;
    const swapOrder = sections[swapIdx].sort_order;

    await Promise.all([
      supabase.from("homepage_sections").update({ sort_order: swapOrder }).eq("id", sections[idx].id),
      supabase.from("homepage_sections").update({ sort_order: currentOrder }).eq("id", sections[swapIdx].id),
    ]);
    refresh();
  };

  const handleDrop = async (targetIdx: number) => {
    if (dragIdx === null || dragIdx === targetIdx) {
      setDragIdx(null);
      setDragOverIdx(null);
      return;
    }
    // Reorder: move dragIdx item to targetIdx position
    const reordered = [...sections];
    const [moved] = reordered.splice(dragIdx, 1);
    reordered.splice(targetIdx, 0, moved);
    // Update all sort_orders
    await Promise.all(
      reordered.map((s: any, i: number) =>
        supabase.from("homepage_sections").update({ sort_order: i }).eq("id", s.id)
      )
    );
    setDragIdx(null);
    setDragOverIdx(null);
    refresh();
    toast.success("Section reordered");
  };

  const deleteSection = async (id: string) => {
    await supabase.from("homepage_sections").delete().eq("id", id);
    refresh();
    toast.success("Section deleted");
  };

  const addSection = async () => {
    if (!newType) return;
    const label = SECTION_TYPES.find(t => t.value === newType)?.label || newType;
    const maxOrder = sections.length > 0 ? Math.max(...sections.map((s: any) => s.sort_order)) + 1 : 0;
    
    const config: Record<string, any> = {};
    if (newType === "category_grid" || newType === "quick_actions") {
      config.mobile_only = true;
    }

    await supabase.from("homepage_sections").insert({
      section_type: newType,
      title: label,
      sort_order: maxOrder,
      config,
    });
    setNewType("");
    refresh();
    toast.success("Section added");
  };

  const updateTitle = async (id: string, title: string) => {
    await supabase.from("homepage_sections").update({ title }).eq("id", id);
    refresh();
  };

  const updateConfig = async (id: string, config: any, updates: Record<string, any>) => {
    await supabase.from("homepage_sections").update({
      config: { ...config, ...updates },
    }).eq("id", id);
    refresh();
    toast.success("Config updated");
  };

  const toggleMobileOnly = async (id: string, config: any, mobile_only: boolean) => {
    await updateConfig(id, config, { mobile_only });
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-bold text-foreground">Section Builder</h2>
        <p className="text-sm text-muted-foreground">Homepage এর sections reorder, add, remove করুন</p>
      </div>

      {/* Add new section */}
      <div className="flex items-center gap-2">
        <Select value={newType} onValueChange={setNewType}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Section type..." />
          </SelectTrigger>
          <SelectContent>
            {SECTION_TYPES.map(t => (
              <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button size="sm" onClick={addSection} disabled={!newType}>
          <Plus size={14} className="mr-1" /> Add
        </Button>
      </div>

      {/* Section list */}
      <div className="space-y-2">
        {sections.map((section: any, idx: number) => (
          <div
            key={section.id}
            draggable
            onDragStart={() => setDragIdx(idx)}
            onDragOver={(e) => { e.preventDefault(); setDragOverIdx(idx); }}
            onDragLeave={() => setDragOverIdx(null)}
            onDrop={(e) => { e.preventDefault(); handleDrop(idx); }}
            onDragEnd={() => { setDragIdx(null); setDragOverIdx(null); }}
            className={`bg-card border rounded-xl overflow-hidden transition-all ${
              section.active ? "border-border" : "border-border opacity-60"
            } ${dragOverIdx === idx && dragIdx !== idx ? "ring-2 ring-primary/50 scale-[1.01]" : ""} ${dragIdx === idx ? "opacity-40" : ""}`}
          >
            <div className="p-4 flex items-center gap-3">
              <div className="flex flex-col gap-0.5 cursor-grab active:cursor-grabbing">
                <button
                  onClick={() => moveSection(section.id, "up")}
                  disabled={idx === 0}
                  className="text-muted-foreground hover:text-foreground disabled:opacity-30"
                >
                  <ArrowUp size={14} />
                </button>
                <GripVertical size={14} className="text-muted-foreground" />
                <button
                  onClick={() => moveSection(section.id, "down")}
                  disabled={idx === sections.length - 1}
                  className="text-muted-foreground hover:text-foreground disabled:opacity-30"
                >
                  <ArrowDown size={14} />
                </button>
              </div>

              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono bg-secondary px-2 py-0.5 rounded text-muted-foreground uppercase">
                    {section.section_type}
                  </span>
                  {section.config?.mobile_only && (
                    <span className="text-[10px] bg-accent/10 text-accent px-2 py-0.5 rounded">
                      Mobile Only
                    </span>
                  )}
                  {section.section_type === "custom_products" && (
                    <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded">
                      {(section.config?.product_ids || []).length} products
                    </span>
                  )}
                  {section.section_type === "ai_trending" && (
                    <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded font-semibold">
                      ✨ AI Powered
                    </span>
                  )}
                </div>
                <Input
                  value={section.title}
                  onChange={(e) => updateTitle(section.id, e.target.value)}
                  className="h-8 text-sm font-medium"
                />
              </div>

              <div className="flex items-center gap-2">
                {section.section_type === "custom_products" && (
                  <button
                    onClick={() => setExpandedId(expandedId === section.id ? null : section.id)}
                    className="text-xs text-muted-foreground hover:text-foreground px-2 py-1 rounded border border-border"
                    title="Select products"
                  >
                    {expandedId === section.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </button>
                )}
                <div className="relative">
                  <input
                    type="color"
                    value={section.config?.bg_color || "#ffffff"}
                    onChange={(e) => updateConfig(section.id, section.config || {}, { bg_color: e.target.value === "#ffffff" ? null : e.target.value })}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    title="Background color"
                  />
                  <div
                    className="text-xs text-muted-foreground hover:text-foreground px-2 py-1 rounded border border-border flex items-center gap-1"
                  >
                    <Palette size={14} />
                    {section.config?.bg_color && (
                      <span className="w-3 h-3 rounded-full border border-border" style={{ backgroundColor: section.config.bg_color }} />
                    )}
                  </div>
                </div>
                <button
                  onClick={() => toggleMobileOnly(section.id, section.config || {}, !section.config?.mobile_only)}
                  className="text-xs text-muted-foreground hover:text-foreground px-2 py-1 rounded border border-border"
                  title="Toggle mobile only"
                >
                  📱
                </button>
                <button
                  onClick={() => toggleActive(section.id, !section.active)}
                  className="text-muted-foreground hover:text-foreground"
                  title={section.active ? "Hide" : "Show"}
                >
                  {section.active ? <Eye size={16} /> : <EyeOff size={16} />}
                </button>
                <button
                  onClick={() => deleteSection(section.id)}
                  className="text-destructive hover:text-destructive/80"
                  title="Delete"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>

            {/* Expandable product picker for custom_products */}
            {section.section_type === "custom_products" && expandedId === section.id && (
              <div className="px-4 pb-4 border-t border-border pt-3 space-y-3">
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">Product Source</p>
                  <div className="flex items-center gap-2">
                    <Select
                      value={section.config?.auto_category_id || "manual"}
                      onValueChange={(v) => updateConfig(section.id, section.config || {}, { auto_category_id: v === "manual" ? null : v })}
                    >
                      <SelectTrigger className="w-[220px] h-8 text-sm">
                        <SelectValue placeholder="Manual selection" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="manual">Manual selection</SelectItem>
                        <CategoryOptions />
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <Switch
                    checked={!!section.config?.only_discounted}
                    onCheckedChange={(v) => updateConfig(section.id, section.config || {}, { only_discounted: v })}
                  />
                  <span className="text-sm text-foreground">Show only discounted products</span>
                </label>
                {!section.config?.auto_category_id && (
                  <ProductPicker
                    selectedIds={section.config?.product_ids || []}
                    onChange={(ids) => updateConfig(section.id, section.config || {}, { product_ids: ids })}
                  />
                )}
                {section.config?.auto_category_id && (
                  <p className="text-xs text-muted-foreground bg-secondary/50 rounded-lg px-3 py-2">
                    ✅ এই category-র সব products automatically দেখাবে
                  </p>
                )}
              </div>
            )}
          </div>
        ))}
        {sections.length === 0 && !isLoading && (
          <p className="text-sm text-muted-foreground text-center py-6">No sections yet. Add one above.</p>
        )}
      </div>
    </div>
  );
};

const FeaturedCategories = () => {
  const qc = useQueryClient();
  const { data: categories = [] } = useQuery({
    queryKey: ["admin-categories-featured"],
    queryFn: async () => {
      const { data, error } = await supabase.from("categories").select("*").order("sort_order");
      if (error) throw error;
      return data;
    },
  });

  const toggleFeatured = async (id: string, featured: boolean) => {
    await supabase.from("categories").update({ featured }).eq("id", id);
    qc.invalidateQueries({ queryKey: ["admin-categories-featured"] });
    toast.success(featured ? "Featured!" : "Removed from featured");
  };

  const updateOrder = async (id: string, sort_order: number) => {
    await supabase.from("categories").update({ sort_order }).eq("id", id);
    qc.invalidateQueries({ queryKey: ["admin-categories-featured"] });
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-bold text-foreground">Featured Categories</h2>
        <p className="text-sm text-muted-foreground">Homepage এ কোন category bands দেখাবে select করুন</p>
      </div>
      <div className="space-y-3">
        {categories.map((cat: any) => (
          <div key={cat.id} className="bg-card border border-border rounded-xl p-4 flex items-center gap-4">
            <span className="text-xl">{cat.icon || "📦"}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-foreground">{cat.name}</p>
            </div>
            <Input
              type="number"
              className="w-20"
              value={cat.sort_order}
              onChange={(e) => updateOrder(cat.id, Number(e.target.value))}
              placeholder="Order"
            />
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Featured</span>
              <Switch checked={cat.featured} onCheckedChange={(v) => toggleFeatured(cat.id, v)} />
            </div>
          </div>
        ))}
        {categories.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-6">No categories yet.</p>
        )}
      </div>
    </div>
  );
};

const AdminHomepage = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-foreground">Homepage Management</h1>
        <p className="text-sm text-muted-foreground">Homepage এর সব dynamic content এখান থেকে manage করুন</p>
      </div>

      <Tabs defaultValue="sections" className="w-full">
        <TabsList className="w-full justify-start bg-secondary/50 rounded-xl p-1">
          <TabsTrigger value="sections" className="rounded-lg">Sections</TabsTrigger>
          <TabsTrigger value="banners" className="rounded-lg">Banners</TabsTrigger>
          <TabsTrigger value="promos" className="rounded-lg">Promo Cards</TabsTrigger>
          <TabsTrigger value="featured" className="rounded-lg">Featured Categories</TabsTrigger>
          <TabsTrigger value="flash" className="rounded-lg">Flash Sale</TabsTrigger>
        </TabsList>
        <TabsContent value="sections"><SectionBuilder /></TabsContent>
        <TabsContent value="banners"><AdminBanners /></TabsContent>
        <TabsContent value="promos"><AdminPromoCards /></TabsContent>
        <TabsContent value="featured"><FeaturedCategories /></TabsContent>
        <TabsContent value="flash"><AdminFlashSale /></TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminHomepage;
