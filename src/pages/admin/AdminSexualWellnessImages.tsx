import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import ImageUploader from "@/components/admin/ImageUploader";
import { toast } from "sonner";
import { Loader2, Search, ImageIcon, CheckCircle2 } from "lucide-react";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const ADMIN_CODE = "990990";
const CATEGORY_ID = "f63f5357-d7e3-44e7-9ce8-fbb6e251a1c5"; // Sexual Wellness

interface Product {
  id: string;
  name: string;
  image_url: string | null;
  stock: number;
  price: number;
}

const AdminSexualWellnessImages = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [savingId, setSavingId] = useState<string | null>(null);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("medicines")
      .select("id, name, image_url, stock, price")
      .eq("category_id", CATEGORY_ID)
      .order("name", { ascending: true });
    if (error) toast.error(error.message);
    else setProducts((data as Product[]) || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return products;
    return products.filter(p => p.name.toLowerCase().includes(q));
  }, [products, search]);

  const updateImage = async (id: string, url: string) => {
    setSavingId(id);
    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/admin-products`, {
        method: "POST",
        headers: { "Content-Type": "application/json", apikey: SUPABASE_KEY },
        body: JSON.stringify({
          admin_code: ADMIN_CODE,
          action: "update",
          id,
          payload: { image_url: url },
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || "Update failed");
      setProducts(prev => prev.map(p => p.id === id ? { ...p, image_url: url } : p));
      setSavedIds(prev => new Set(prev).add(id));
      toast.success("Image updated");
    } catch (e: any) {
      toast.error(e.message || "Failed to update image");
    } finally {
      setSavingId(null);
    }
  };

  const withImage = products.filter(p => p.image_url && !p.image_url.includes("wikimedia")).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <ImageIcon size={22} className="text-primary" />
            Sexual Wellness — Image Manager
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Replace product images. Files are auto-resized to 1000px max, compressed to WebP, and saved instantly.
          </p>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <span className="px-3 py-1.5 rounded-full bg-secondary">
            {withImage} / {products.length} have custom images
          </span>
        </div>
      </div>

      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search products..."
          className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-border bg-secondary/30 text-sm outline-none focus:ring-2 focus:ring-primary/20"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="animate-spin text-primary" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">No products found</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map(product => (
            <div
              key={product.id}
              className="rounded-2xl border border-border bg-card p-4 space-y-3 relative"
            >
              {savedIds.has(product.id) && (
                <div className="absolute top-3 right-3 flex items-center gap-1 text-xs text-green-600 bg-green-500/10 px-2 py-0.5 rounded-full">
                  <CheckCircle2 size={12} /> Updated
                </div>
              )}
              <div className="text-sm font-semibold line-clamp-2 min-h-[2.5rem]">{product.name}</div>
              <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                <span>৳{product.price}</span>
                <span>•</span>
                <span className={product.stock > 0 ? "text-green-600" : "text-destructive"}>
                  {product.stock > 0 ? `Stock: ${product.stock}` : "Out of stock"}
                </span>
              </div>
              {savingId === product.id ? (
                <div className="flex items-center gap-2 text-xs text-muted-foreground py-2">
                  <Loader2 size={14} className="animate-spin" /> Saving...
                </div>
              ) : (
                <ImageUploader
                  value={product.image_url || ""}
                  onChange={(url) => {
                    if (url && url !== product.image_url) updateImage(product.id, url);
                    else if (!url) updateImage(product.id, "");
                  }}
                />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminSexualWellnessImages;
