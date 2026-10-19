import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, X, Loader2, GripVertical, Star, StarOff, FolderOpen, ImagePlus, Eye, EyeOff } from "lucide-react";
import ImageUploader from "@/components/admin/ImageUploader";

const AdminCategories = () => {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("");
  const [sortOrder, setSortOrder] = useState(0);
  const [featured, setFeatured] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const [search, setSearch] = useState("");

  const { data: categories, isLoading } = useQuery({
    queryKey: ["admin-categories"],
    queryFn: async () => {
      const { data, error } = await supabase.from("categories").select("*").order("sort_order", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = { name, icon: icon || null, sort_order: sortOrder, featured, image_url: imageUrl || null };
      if (editId) {
        const { error } = await supabase.from("categories").update(payload).eq("id", editId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("categories").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin-categories"] }); toast.success(editId ? "Category updated" : "Category added"); resetForm(); },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("categories").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin-categories"] }); toast.success("Category deleted"); },
    onError: (e: any) => toast.error(e.message),
  });

  const toggleFeatured = useMutation({
    mutationFn: async ({ id, val }: { id: string; val: boolean }) => {
      const { error } = await supabase.from("categories").update({ featured: val }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin-categories"] }); },
  });

  const toggleActive = useMutation({
    mutationFn: async ({ id, val }: { id: string; val: boolean }) => {
      const { error } = await supabase.from("categories").update({ is_active: val }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_d, v) => { queryClient.invalidateQueries({ queryKey: ["admin-categories"] }); toast.success(v.val ? "Category is now visible on the site" : "Category hidden from the site"); },
    onError: (e: any) => toast.error(e.message),
  });

  const resetForm = () => { setShowForm(false); setEditId(null); setName(""); setIcon(""); setSortOrder(0); setFeatured(false); setImageUrl(""); };
  const startEdit = (c: any) => { setEditId(c.id); setName(c.name); setIcon(c.icon || ""); setSortOrder(c.sort_order || 0); setFeatured(c.featured || false); setImageUrl(c.image_url || ""); setShowForm(true); };

  const filtered = categories?.filter(c => !search || c.name.toLowerCase().includes(search.toLowerCase()));
  const featuredCount = categories?.filter(c => c.featured).length || 0;

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-card rounded-xl border border-border p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
            <FolderOpen size={18} />
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground">{categories?.length || 0}</p>
            <p className="text-[10px] text-muted-foreground">Total</p>
          </div>
        </div>
        <div className="bg-card rounded-xl border border-border p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-600">
            <Star size={18} />
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground">{featuredCount}</p>
            <p className="text-[10px] text-muted-foreground">Featured</p>
          </div>
        </div>
        <div className="bg-card rounded-xl border border-border p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600">
            <Plus size={18} />
          </div>
          <button onClick={() => { resetForm(); setShowForm(true); }} className="text-left">
            <p className="text-sm font-semibold text-foreground">Add New</p>
            <p className="text-[10px] text-muted-foreground">Category</p>
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-card rounded-xl border border-border p-3 flex gap-2">
        <div className="relative flex-1">
          <input
            placeholder="Search categories..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-4 pr-4 py-2.5 rounded-lg bg-secondary/40 border-0 text-sm outline-none focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground/60"
          />
        </div>
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          className="px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold flex items-center gap-1.5 hover:bg-primary/90 transition-colors"
        >
          <Plus size={14} /> Add Category
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-card rounded-xl border border-primary/20 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-foreground">{editId ? "Edit Category" : "New Category"}</h4>
            <button onClick={resetForm} className="p-1.5 rounded-lg hover:bg-secondary/60 text-muted-foreground"><X size={14} /></button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-[1fr_80px_100px_auto] gap-2.5">
            <input
              placeholder="Category name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="px-3 py-2.5 rounded-lg bg-secondary/40 border border-border text-sm outline-none focus:ring-2 focus:ring-primary/20"
              required
            />
            <input
              placeholder="Icon"
              value={icon}
              onChange={(e) => setIcon(e.target.value)}
              className="px-3 py-2.5 rounded-lg bg-secondary/40 border border-border text-sm outline-none focus:ring-2 focus:ring-primary/20 text-center"
            />
            <input
              type="number"
              placeholder="Order"
              value={sortOrder}
              onChange={(e) => setSortOrder(Number(e.target.value))}
              className="px-3 py-2.5 rounded-lg bg-secondary/40 border border-border text-sm outline-none focus:ring-2 focus:ring-primary/20"
            />
            <label className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-secondary/40 border border-border cursor-pointer text-xs">
              <input type="checkbox" checked={featured} onChange={(e) => setFeatured(e.target.checked)} className="accent-primary" />
              Featured
            </label>
          </div>
          <div>
            <label className="text-xs font-medium text-foreground mb-1 block">Category Image (optional — replaces icon on homepage)</label>
            <ImageUploader value={imageUrl} onChange={setImageUrl} />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending || !name}
              className="px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold disabled:opacity-50 flex items-center gap-1.5"
            >
              {saveMutation.isPending && <Loader2 className="animate-spin" size={14} />}
              {editId ? "Update" : "Save"}
            </button>
            <button onClick={resetForm} className="px-4 py-2.5 rounded-lg bg-secondary/60 text-muted-foreground text-xs font-medium">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Categories Table */}
      {isLoading ? (
        <div className="flex justify-center py-16"><Loader2 className="animate-spin text-primary" size={24} /></div>
      ) : !filtered?.length ? (
        <div className="bg-card rounded-xl border border-border p-16 text-center">
          <FolderOpen size={40} className="text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">No categories found</p>
        </div>
      ) : (
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          {/* Table Header */}
          <div className="hidden sm:grid grid-cols-[40px_1fr_60px_80px_80px_120px] items-center px-4 py-2.5 border-b border-border bg-secondary/20">
            <span className="text-[10px] text-muted-foreground font-medium">#</span>
            <span className="text-[10px] text-muted-foreground font-medium">Category</span>
            <span className="text-[10px] text-muted-foreground font-medium text-center">Icon</span>
            <span className="text-[10px] text-muted-foreground font-medium text-center">Order</span>
            <span className="text-[10px] text-muted-foreground font-medium text-center">Featured</span>
            <span className="text-[10px] text-muted-foreground font-medium text-right">Actions</span>
          </div>

          {/* Table Rows */}
          {filtered.map((c, idx) => (
            <div
              key={c.id}
              className="grid grid-cols-[auto_1fr_auto] sm:grid-cols-[40px_1fr_60px_80px_80px_120px] items-center px-4 py-3 border-b border-border last:border-0 hover:bg-secondary/10 transition-colors gap-2 sm:gap-0"
            >
              {/* # */}
              <span className="hidden sm:block text-xs text-muted-foreground">{idx + 1}</span>

              {/* Name */}
              <div className="flex items-center gap-2.5 col-span-1">
                {c.image_url ? (
                  <img src={c.image_url} alt={c.name} className="w-8 h-8 rounded-lg object-contain bg-secondary/30" />
                ) : (
                  <span className="text-xl">{c.icon || "📁"}</span>
                )}
                <span className={`text-sm font-medium ${c.is_active === false ? "text-muted-foreground line-through" : "text-foreground"}`}>{c.name}</span>
                {c.is_active === false && <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-destructive/10 text-destructive font-semibold">Hidden</span>}
                {c.featured && <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 font-semibold sm:hidden">Featured</span>}
              </div>

              {/* Icon (desktop) */}
              <span className="hidden sm:block text-center text-lg">{c.icon || "—"}</span>

              {/* Sort Order (desktop) */}
              <span className="hidden sm:block text-center text-xs text-muted-foreground">{c.sort_order}</span>

              {/* Featured Toggle (desktop) */}
              <div className="hidden sm:flex justify-center">
                <button
                  onClick={() => toggleFeatured.mutate({ id: c.id, val: !c.featured })}
                  className={`p-1.5 rounded-lg transition-colors ${c.featured ? "text-amber-500 hover:bg-amber-500/10" : "text-muted-foreground/40 hover:bg-secondary/60"}`}
                >
                  {c.featured ? <Star size={15} fill="currentColor" /> : <StarOff size={15} />}
                </button>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 justify-end">
                <button
                  onClick={() => toggleActive.mutate({ id: c.id, val: c.is_active === false })}
                  title={c.is_active === false ? "Show on site" : "Hide from site"}
                  className={`p-1.5 rounded-lg hover:bg-secondary/60 transition-colors ${c.is_active === false ? "text-destructive" : "text-emerald-600"}`}
                >
                  {c.is_active === false ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
                <button
                  onClick={() => toggleFeatured.mutate({ id: c.id, val: !c.featured })}
                  className={`sm:hidden p-1.5 rounded-lg transition-colors ${c.featured ? "text-amber-500" : "text-muted-foreground/40"}`}
                >
                  {c.featured ? <Star size={14} fill="currentColor" /> : <StarOff size={14} />}
                </button>
                <button onClick={() => startEdit(c)} className="p-1.5 rounded-lg hover:bg-secondary/60 text-muted-foreground hover:text-foreground transition-colors">
                  <Pencil size={14} />
                </button>
                <button
                  onClick={() => { if (confirm("Delete this category?")) deleteMutation.mutate(c.id); }}
                  className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminCategories;
