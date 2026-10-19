import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import ImageUploader from "@/components/admin/ImageUploader";

const AdminCategoryLayouts = () => {
  const qc = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);

  const { data: categories = [] } = useQuery({
    queryKey: ["admin-categories-all"],
    queryFn: async () => {
      const { data, error } = await supabase.from("categories").select("*").order("sort_order");
      if (error) throw error;
      return data;
    },
  });

  const { data: layouts = [] } = useQuery({
    queryKey: ["admin-category-layouts"],
    queryFn: async () => {
      const { data, error } = await supabase.from("category_layouts").select("*");
      if (error) throw error;
      return data;
    },
  });

  const getLayout = (catId: string) => layouts.find((l: any) => l.category_id === catId);

  const saveLayout = async (catId: string, updates: any) => {
    const existing = getLayout(catId);
    if (existing) {
      await supabase.from("category_layouts").update(updates).eq("id", existing.id);
    } else {
      await supabase.from("category_layouts").insert({ category_id: catId, ...updates });
    }
    qc.invalidateQueries({ queryKey: ["admin-category-layouts"] });
    toast.success("Layout saved");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-foreground">Category Layouts</h1>
        <p className="text-sm text-muted-foreground">প্রতিটি ক্যাটাগরির আলাদা banner, description ও layout set করুন</p>
      </div>

      <div className="space-y-3">
        {categories.map((cat: any) => {
          const layout = getLayout(cat.id);
          const isEditing = editingId === cat.id;

          return (
            <div key={cat.id} className="bg-card border border-border rounded-xl overflow-hidden">
              <div
                className="p-4 flex items-center gap-3 cursor-pointer hover:bg-secondary/30 transition-colors"
                onClick={() => setEditingId(isEditing ? null : cat.id)}
              >
                <span className="text-xl">{cat.icon || "📦"}</span>
                <div className="flex-1">
                  <p className="text-sm font-bold text-foreground">{cat.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {layout ? `Banner: ${layout.banner_url ? "✅" : "❌"} | View: ${layout.default_view}` : "No custom layout"}
                  </p>
                </div>
                <span className="text-xs text-muted-foreground">{isEditing ? "▲" : "▼"}</span>
              </div>

              {isEditing && (
                <CategoryLayoutEditor
                  catId={cat.id}
                  layout={layout}
                  onSave={(updates: any) => saveLayout(cat.id, updates)}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

const CategoryLayoutEditor = ({ catId, layout, onSave }: { catId: string; layout: any; onSave: (u: any) => void }) => {
  const [bannerUrl, setBannerUrl] = useState(layout?.banner_url || "");
  const [description, setDescription] = useState(layout?.description || "");
  const [seoText, setSeoText] = useState(layout?.seo_text || "");
  const [defaultView, setDefaultView] = useState(layout?.default_view || "grid");
  const [showFilters, setShowFilters] = useState(layout?.show_filters ?? true);

  const handleSave = () => {
    onSave({
      banner_url: bannerUrl || null,
      description: description || null,
      seo_text: seoText || null,
      default_view: defaultView,
      show_filters: showFilters,
    });
  };

  return (
    <div className="px-4 pb-4 space-y-4 border-t border-border pt-4">
      <div>
        <label className="text-xs font-medium text-foreground mb-1 block">Category Banner</label>
        <ImageUploader value={bannerUrl} onChange={setBannerUrl} />
      </div>

      <div>
        <label className="text-xs font-medium text-foreground mb-1 block">Description (shown above products)</label>
        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Category description..."
          className="min-h-[80px]"
        />
      </div>

      <div>
        <label className="text-xs font-medium text-foreground mb-1 block">SEO Text (bottom of page)</label>
        <Textarea
          value={seoText}
          onChange={(e) => setSeoText(e.target.value)}
          placeholder="SEO content for search engines..."
          className="min-h-[80px]"
        />
      </div>

      <div className="flex items-center gap-4">
        <div>
          <label className="text-xs font-medium text-foreground mb-1 block">Default View</label>
          <Select value={defaultView} onValueChange={setDefaultView}>
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="grid">Grid</SelectItem>
              <SelectItem value="list">List</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2 pt-4">
          <span className="text-xs text-muted-foreground">Show Filters</span>
          <Switch checked={showFilters} onCheckedChange={setShowFilters} />
        </div>
      </div>

      <Button size="sm" onClick={handleSave}>Save Layout</Button>
    </div>
  );
};

export default AdminCategoryLayouts;
