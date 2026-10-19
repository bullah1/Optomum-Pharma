import { useState, useMemo, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

const adminProductApi = async (body: Record<string, any>) => {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/admin-products`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "apikey": SUPABASE_KEY },
    body: JSON.stringify({ admin_code: "990990", ...body }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Operation failed");
  return data;
};
import { Plus, Pencil, Trash2, X, Loader2, Search, Image, CheckSquare, Package, ChevronLeft, ChevronRight, Eye, Upload, Download, Sparkles } from "lucide-react";

const PAGE_SIZE = 20;
import RichTextEditor from "@/components/admin/RichTextEditor";
import CompanyCombobox from "@/components/admin/CompanyCombobox";
import ImageUploader from "@/components/admin/ImageUploader";

const inputClass = "w-full px-4 py-3 rounded-2xl border border-border bg-secondary/30 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-muted-foreground/50";

const slugify = (text: string) =>
  text.toLowerCase().trim().replace(/[^\w\s-]/g, "").replace(/[\s_]+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");

const parseCSVLine = (line: string): string[] => {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"' && line[i + 1] === '"') { current += '"'; i++; }
      else if (ch === '"') { inQuotes = false; }
      else { current += ch; }
    } else {
      if (ch === '"') { inQuotes = true; }
      else if (ch === ',') { result.push(current); current = ""; }
      else { current += ch; }
    }
  }
  result.push(current);
  return result;
};

const DOSAGE_FORMS = ["Tablet", "Capsule", "Syrup", "Injection", "Cream", "Ointment", "Gel", "Drops", "Inhaler", "Suspension", "Powder", "Suppository", "Patch", "Spray", "Solution", "Lotion", "Other"];

type FormState = {
  name: string; name_bn: string; price: string; original_price: string; b2b_price: string; company: string;
  description: string; stock: string; requires_prescription: boolean; category_id: string;
  image_url: string; delivery_time: string; slug: string; meta_title: string; meta_description: string;
  dosage_form: string; strength: string;
};

const emptyForm: FormState = {
  name: "", name_bn: "", price: "", original_price: "", b2b_price: "", company: "",
  description: "", stock: "0", requires_prescription: false, category_id: "",
  image_url: "", delivery_time: "12-24 Hours", slug: "", meta_title: "", meta_description: "",
  dosage_form: "", strength: "",
};

const getDiscount = (price: number, originalPrice: number | null) => {
  if (!originalPrice || originalPrice <= price) return 0;
  return Math.round(((originalPrice - price) / originalPrice) * 100);
};

const AdminProducts = () => {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [form, setForm] = useState<FormState>({ ...emptyForm });
  // Bulk selection
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkStockValue, setBulkStockValue] = useState("");
  const [showBulkStock, setShowBulkStock] = useState(false);
  const [showBulkCategory, setShowBulkCategory] = useState(false);
  const [bulkCategoryValue, setBulkCategoryValue] = useState("");
  const [page, setPage] = useState(0);
  const [sortBy, setSortBy] = useState<string>("created_at");
  const [sortAsc, setSortAsc] = useState(false);
  const [csvImporting, setCsvImporting] = useState(false);
  const [aiGenerating, setAiGenerating] = useState(false);
  const csvFileRef = useRef<HTMLInputElement>(null);

  const handleAiGenerate = async () => {
    if (!form.name.trim()) { toast.error("Enter product name first"); return; }
    setAiGenerating(true);
    try {
      const catName = categories?.find((c: any) => c.id === form.category_id)?.name || "";
      const res = await fetch(`${SUPABASE_URL}/functions/v1/generate-product-seo`, {
        method: "POST",
        headers: { "Content-Type": "application/json", apikey: SUPABASE_KEY },
        body: JSON.stringify({
          name: form.name, category: catName, company: form.company,
          dosage_form: form.dosage_form, strength: form.strength,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "AI generation failed");
      setForm(prev => ({
        ...prev,
        meta_title: data.meta_title || prev.meta_title,
        meta_description: data.meta_description || prev.meta_description,
        description: data.description || prev.description,
      }));
      toast.success("✨ AI content generated!");
    } catch (e: any) {
      toast.error(e.message || "AI generation failed");
    } finally {
      setAiGenerating(false);
    }
  };

  const { data: productsData, isLoading } = useQuery({
    queryKey: ["admin-products", search, filterCategory, page, sortBy, sortAsc],
    staleTime: 2 * 60 * 1000,
    queryFn: async () => {
      let query = supabase.from("medicines").select("*, categories(name)", { count: "exact" });
      if (search) {
        query = query.or(`name.ilike.%${search}%,company.ilike.%${search}%,name_bn.ilike.%${search}%`);
      }
      if (filterCategory) {
        query = query.eq("category_id", filterCategory);
      }
      query = query.order(sortBy, { ascending: sortAsc }).range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);
      const { data, error, count } = await query;
      if (error) throw error;
      return { items: data, total: count ?? 0 };
    },
  });

  const products = productsData?.items;
  const totalCount = productsData?.total ?? 0;
  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  const { data: categories } = useQuery({
    queryKey: ["admin-categories-list"],
    staleTime: 2 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase.from("categories").select("id, name").order("name");
      if (error) throw error;
      return data;
    },
  });

  const companyList = useMemo(() => {
    if (!products) return [];
    const set = new Set<string>();
    products.forEach(p => { if (p.company) set.add(p.company); });
    return Array.from(set).sort();
  }, [products]);

  const [b2cPercent, setB2cPercent] = useState("");
  const [b2bPercent, setB2bPercent] = useState("");

  const price = parseFloat(form.price) || 0;
  const originalPrice = parseFloat(form.original_price) || 0;
  const discount = originalPrice > 0 && originalPrice > price
    ? Math.round(((originalPrice - price) / originalPrice) * 100) : 0;
  const discountedDisplay = originalPrice > 0 && price > 0 && price < originalPrice
    ? `৳${price.toFixed(2)} (${discount}% off)` : null;
  const priceError = price < 0 ? "Price cannot be negative" : null;
  const originalPriceError = originalPrice < 0 ? "Original price cannot be negative" : null;
  const discountError = originalPrice > 0 && price > originalPrice ? "Price is higher than original price" : null;

  const handleB2cPercentChange = (pct: string) => {
    setB2cPercent(pct);
    const p = parseFloat(pct);
    if (originalPrice > 0 && !isNaN(p) && p >= 0 && p <= 100) {
      setForm(prev => ({ ...prev, price: (Math.round(originalPrice * (1 - p / 100) * 100) / 100).toString() }));
    }
  };

  const handleB2bPercentChange = (pct: string) => {
    setB2bPercent(pct);
    const p = parseFloat(pct);
    if (originalPrice > 0 && !isNaN(p) && p >= 0 && p <= 100) {
      setForm(prev => ({ ...prev, b2b_price: (Math.round(originalPrice * (1 - p / 100) * 100) / 100).toString() }));
    }
  };

  const handleOriginalPriceChange = (val: string) => {
    setForm(prev => ({ ...prev, original_price: val }));
    const mrp = parseFloat(val) || 0;
    if (mrp > 0) {
      const b2cP = parseFloat(b2cPercent);
      if (!isNaN(b2cP) && b2cP >= 0 && b2cP <= 100) {
        setForm(prev => ({ ...prev, original_price: val, price: (Math.round(mrp * (1 - b2cP / 100) * 100) / 100).toString() }));
      }
      const b2bP = parseFloat(b2bPercent);
      if (!isNaN(b2bP) && b2bP >= 0 && b2bP <= 100) {
        setForm(prev => ({ ...prev, original_price: val, b2b_price: (Math.round(mrp * (1 - b2bP / 100) * 100) / 100).toString() }));
      }
    }
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (price < 0 || originalPrice < 0) throw new Error("Price values must be positive");
      if (originalPrice > 0 && price > originalPrice) throw new Error("Price cannot exceed original price");
      const payload: Record<string, any> = {
        name: form.name.trim(), name_bn: form.name_bn.trim() || null,
        price: Math.round(price * 100) / 100,
        original_price: originalPrice > 0 ? Math.round(originalPrice * 100) / 100 : null,
        company: form.company.trim() || null, description: form.description || null,
        stock: Math.max(0, parseInt(form.stock) || 0), requires_prescription: form.requires_prescription,
        category_id: form.category_id || null, image_url: form.image_url.trim() || null,
        delivery_time: form.delivery_time || "12-24 Hours",
        slug: form.slug.trim() || null, meta_title: form.meta_title.trim() || null, meta_description: form.meta_description.trim() || null,
        dosage_form: form.dosage_form || null, strength: form.strength.trim() || null,
        b2b_price: form.b2b_price ? Math.round(parseFloat(form.b2b_price) * 100) / 100 : null,
      };
      if (editId) {
        await adminProductApi({ action: "update", id: editId, payload });
      } else {
        await adminProductApi({ action: "insert", payload });
      }
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin-products"] }); toast.success(editId ? "Product updated" : "Product added"); resetForm(); },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { await adminProductApi({ action: "delete", id }); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin-products"] }); toast.success("Product deleted"); },
    onError: (e: any) => toast.error(e.message),
  });

  // Bulk delete
  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      await adminProductApi({ action: "bulk_delete", ids });
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin-products"] }); setSelected(new Set()); toast.success("Products deleted"); },
    onError: (e: any) => toast.error(e.message),
  });

  // Bulk stock update
  const bulkStockMutation = useMutation({
    mutationFn: async ({ ids, stock }: { ids: string[]; stock: number }) => {
      await adminProductApi({ action: "bulk_update", ids, payload: { stock } });
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin-products"] }); setSelected(new Set()); setShowBulkStock(false); setBulkStockValue(""); toast.success("Stock updated"); },
    onError: (e: any) => toast.error(e.message),
  });

  // Bulk category update
  const bulkCategoryMutation = useMutation({
    mutationFn: async ({ ids, category_id }: { ids: string[]; category_id: string | null }) => {
      await adminProductApi({ action: "bulk_update", ids, payload: { category_id } });
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin-products"] }); setSelected(new Set()); setShowBulkCategory(false); setBulkCategoryValue(""); toast.success("Category updated"); },
    onError: (e: any) => toast.error(e.message),
  });

  const resetForm = () => { setShowForm(false); setEditId(null); setForm({ ...emptyForm }); setB2cPercent(""); setB2bPercent(""); };

  const startEdit = (p: any) => {
    setEditId(p.id);
    setForm({
      name: p.name, name_bn: p.name_bn || "", price: String(p.price), original_price: p.original_price ? String(p.original_price) : "",
      company: p.company || "", description: p.description || "", stock: String(p.stock), requires_prescription: p.requires_prescription,
      category_id: p.category_id || "", image_url: p.image_url || "", delivery_time: p.delivery_time || "12-24 Hours",
      slug: (p as any).slug || "", meta_title: (p as any).meta_title || "", meta_description: (p as any).meta_description || "",
      dosage_form: (p as any).dosage_form || "", strength: (p as any).strength || "",
      b2b_price: (p as any).b2b_price ? String((p as any).b2b_price) : "",
    });
    setShowForm(true);
  };

  const handleNameChange = (name: string) => {
    const updates: Partial<FormState> = { name };
    if (!editId || !form.slug) updates.slug = slugify(name);
    if (!form.meta_title) updates.meta_title = name.slice(0, 60);
    setForm(prev => ({ ...prev, ...updates }));
  };

  const filtered = products;

  const canSave = form.name.trim() && price >= 0 && !discountError;

  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (!filtered) return;
    if (selected.size === filtered.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtered.map(p => p.id)));
    }
  };

  const handleBulkDelete = () => {
    if (selected.size === 0) return;
    if (confirm(`Delete ${selected.size} product(s)?`)) {
      bulkDeleteMutation.mutate(Array.from(selected));
    }
  };

  const handleBulkStock = () => {
    const stock = parseInt(bulkStockValue);
    if (isNaN(stock) || stock < 0) { toast.error("Enter a valid stock number"); return; }
    bulkStockMutation.mutate({ ids: Array.from(selected), stock });
  };

  // CSV Export
  const handleCsvExport = async () => {
    try {
      const { data, error } = await supabase.from("medicines").select("name,name_bn,price,original_price,b2b_price,company,stock,requires_prescription,category_id,image_url,delivery_time,slug,meta_title,meta_description,dosage_form,strength,description").order("created_at", { ascending: false });
      if (error) throw error;
      if (!data || data.length === 0) { toast.error("No products to export"); return; }

      const catMap: Record<string, string> = {};
      categories?.forEach(c => { catMap[c.id] = c.name; });

      const headers = ["name","name_bn","price","original_price","b2b_price","company","stock","requires_prescription","category","image_url","delivery_time","slug","meta_title","meta_description","dosage_form","strength","description"];
      const csvRows = [headers.join(",")];
      data.forEach(row => {
        const values = headers.map(h => {
          let val = h === "category" ? (catMap[row.category_id] || "") : (row as any)[h];
          if (val === null || val === undefined) val = "";
          val = String(val).replace(/"/g, '""');
          if (String(val).includes(",") || String(val).includes('"') || String(val).includes("\n")) val = `"${val}"`;
          return val;
        });
        csvRows.push(values.join(","));
      });

      const blob = new Blob([csvRows.join("\n")], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = `products_export_${new Date().toISOString().slice(0,10)}.csv`;
      a.click(); URL.revokeObjectURL(url);
      toast.success(`${data.length} products exported`);
    } catch (e: any) { toast.error(e.message); }
  };

  // CSV Import
  const handleCsvImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCsvImporting(true);

    try {
      const text = await file.text();
      const lines = text.split("\n").map(l => l.trim()).filter(Boolean);
      if (lines.length < 2) throw new Error("CSV file is empty or has no data rows");

      const headers = lines[0].split(",").map(h => h.replace(/^"|"$/g, "").trim().toLowerCase());

      const catNameMap: Record<string, string> = {};
      categories?.forEach(c => { catNameMap[c.name.toLowerCase()] = c.id; });

      const items: any[] = [];
      for (let i = 1; i < lines.length; i++) {
        const values = parseCSVLine(lines[i]);
        const row: any = {};
        headers.forEach((h, idx) => { row[h] = values[idx] || ""; });

        const name = row.name?.trim();
        if (!name) continue;

        const item: any = {
          name,
          name_bn: row.name_bn || null,
          price: parseFloat(row.price) || 0,
          original_price: row.original_price ? parseFloat(row.original_price) : null,
          b2b_price: row.b2b_price ? parseFloat(row.b2b_price) : null,
          company: row.company || null,
          stock: parseInt(row.stock) || 0,
          requires_prescription: row.requires_prescription === "true",
          image_url: row.image_url || null,
          delivery_time: row.delivery_time || "12-24 Hours",
          slug: row.slug || slugify(name),
          meta_title: row.meta_title || null,
          meta_description: row.meta_description || null,
          dosage_form: row.dosage_form || null,
          strength: row.strength || null,
          description: row.description || null,
        };

        if (row.category) {
          const catId = catNameMap[row.category.toLowerCase()];
          if (catId) item.category_id = catId;
        } else if (row.category_id) {
          item.category_id = row.category_id;
        }

        items.push(item);
      }

      if (items.length === 0) throw new Error("No valid products found in CSV");

      await adminProductApi({ action: "bulk_insert", items });
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      toast.success(`${items.length} products imported successfully!`);
    } catch (err: any) {
      toast.error(err.message || "CSV import failed");
    } finally {
      setCsvImporting(false);
      if (csvFileRef.current) csvFileRef.current.value = "";
    }
  };

  return (
    <div className="space-y-4">
      {/* Hidden CSV file input */}
      <input type="file" accept=".csv" ref={csvFileRef} onChange={handleCsvImport} className="hidden" />
      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input placeholder="Search products..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }} className="w-full pl-10 pr-4 py-3 rounded-2xl border border-border bg-card text-sm outline-none focus:ring-2 focus:ring-primary/20" />
        </div>
        <select className="px-4 py-3 rounded-2xl border border-border bg-card text-sm outline-none focus:ring-2 focus:ring-primary/20 min-w-[150px]" value={filterCategory} onChange={(e) => { setFilterCategory(e.target.value); setPage(0); }}>
          <option value="">All Categories</option>
          {categories?.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select
          className="px-4 py-3 rounded-2xl border border-border bg-card text-sm outline-none focus:ring-2 focus:ring-primary/20 min-w-[150px]"
          value={`${sortBy}:${sortAsc ? "asc" : "desc"}`}
          onChange={(e) => {
            const [field, dir] = e.target.value.split(":");
            setSortBy(field);
            setSortAsc(dir === "asc");
            setPage(0);
          }}
        >
          <option value="created_at:desc">Newest First</option>
          <option value="created_at:asc">Oldest First</option>
          <option value="name:asc">Name A–Z</option>
          <option value="name:desc">Name Z–A</option>
          <option value="price:asc">Price: Low → High</option>
          <option value="price:desc">Price: High → Low</option>
          <option value="stock:asc">Stock: Low → High</option>
          <option value="stock:desc">Stock: High → Low</option>
        </select>
        <button onClick={() => { resetForm(); setShowForm(true); }} className="gradient-accent text-accent-foreground text-sm font-semibold px-4 py-2.5 rounded-2xl shadow-ios hover:scale-105 active:scale-95 transition-transform flex items-center gap-1.5 whitespace-nowrap">
          <Plus size={16} /> New
        </button>
        <button onClick={() => csvFileRef.current?.click()} disabled={csvImporting} className="text-sm font-semibold px-4 py-2.5 rounded-2xl border border-border bg-card hover:bg-secondary/60 transition-colors flex items-center gap-1.5 whitespace-nowrap">
          {csvImporting ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />} CSV Import
        </button>
        <button onClick={handleCsvExport} className="text-sm font-semibold px-4 py-2.5 rounded-2xl border border-border bg-card hover:bg-secondary/60 transition-colors flex items-center gap-1.5 whitespace-nowrap">
          <Download size={16} /> Export
        </button>
      </div>

      {/* Bulk Actions Bar */}
      {selected.size > 0 && (
        <div className="flex items-center gap-2 flex-wrap bg-primary/5 border border-primary/20 rounded-2xl px-4 py-2.5">
          <span className="text-sm font-semibold text-primary">{selected.size} selected</span>
          <div className="w-px h-5 bg-border/60" />
          <button onClick={handleBulkDelete} disabled={bulkDeleteMutation.isPending} className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors flex items-center gap-1">
            {bulkDeleteMutation.isPending ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
            Delete
          </button>
          {showBulkStock ? (
            <div className="flex items-center gap-1.5">
              <input type="number" min="0" placeholder="New stock" value={bulkStockValue} onChange={e => setBulkStockValue(e.target.value)}
                className="w-24 px-3 py-1.5 rounded-xl border border-border bg-card text-xs outline-none focus:ring-2 focus:ring-primary/20" />
              <button onClick={handleBulkStock} disabled={bulkStockMutation.isPending} className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-primary/10 text-primary hover:bg-primary/20 transition-colors">
                {bulkStockMutation.isPending ? <Loader2 size={12} className="animate-spin" /> : "Apply"}
              </button>
              <button onClick={() => { setShowBulkStock(false); setBulkStockValue(""); }} className="text-xs text-muted-foreground px-1">
                <X size={12} />
              </button>
            </div>
          ) : (
            <button onClick={() => setShowBulkStock(true)} className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-primary/10 text-primary hover:bg-primary/20 transition-colors flex items-center gap-1">
              <Package size={12} /> Update Stock
            </button>
          )}
          <div className="w-px h-5 bg-border/60" />
          {showBulkCategory ? (
            <div className="flex items-center gap-1.5">
              <select value={bulkCategoryValue} onChange={e => setBulkCategoryValue(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-border bg-card text-xs outline-none focus:ring-2 focus:ring-primary/20 min-w-[140px]">
                <option value="">Select Category</option>
                {categories?.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <button onClick={() => { if (!bulkCategoryValue) { toast.error("Select a category"); return; } bulkCategoryMutation.mutate({ ids: Array.from(selected), category_id: bulkCategoryValue }); }} disabled={bulkCategoryMutation.isPending} className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-primary/10 text-primary hover:bg-primary/20 transition-colors">
                {bulkCategoryMutation.isPending ? <Loader2 size={12} className="animate-spin" /> : "Apply"}
              </button>
              <button onClick={() => { setShowBulkCategory(false); setBulkCategoryValue(""); }} className="text-xs text-muted-foreground px-1">
                <X size={12} />
              </button>
            </div>
          ) : (
            <button onClick={() => setShowBulkCategory(true)} className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-secondary text-foreground hover:bg-secondary/80 transition-colors flex items-center gap-1">
              📁 Change Category
            </button>
          )}
          <button onClick={() => setSelected(new Set())} className="text-xs text-muted-foreground ml-auto hover:text-foreground">Clear</button>
        </div>
      )}

      <p className="text-sm text-muted-foreground">{totalCount} products {totalPages > 1 && `· Page ${page + 1} of ${totalPages}`}</p>

      {showForm && (
        <div className="bg-card rounded-2xl shadow-ios p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-foreground">{editId ? "Edit Product" : "New Product"}</h4>
            <button onClick={resetForm} className="p-1.5 rounded-full bg-muted text-muted-foreground hover:text-foreground"><X size={16} /></button>
          </div>

          {/* Basic Info */}
          <div className="space-y-1">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Basic Info</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input placeholder="Name (English) *" value={form.name} onChange={(e) => handleNameChange(e.target.value)} className={inputClass} required />
              <input placeholder="Name (Bangla — SEO)" value={form.name_bn} onChange={(e) => setForm({ ...form, name_bn: e.target.value })} className={inputClass} />
            </div>
          </div>

          {/* Dosage Form & Strength */}
          <div className="space-y-1">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Dosage Form & Strength</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <select className={inputClass} value={form.dosage_form} onChange={(e) => setForm({ ...form, dosage_form: e.target.value })}>
                <option value="">Select Dosage Form</option>
                {DOSAGE_FORMS.map(df => <option key={df} value={df}>{df}</option>)}
              </select>
              <input placeholder="Strength (e.g. 20mg, 500mg, 5ml)" value={form.strength} onChange={(e) => setForm({ ...form, strength: e.target.value })} className={inputClass} />
            </div>
          </div>

          {/* Price & Stock */}
          <div className="space-y-1">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Price & Stock</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <input placeholder="Original Price (MRP) *" type="number" min="0" step="0.01" value={form.original_price} onChange={(e) => handleOriginalPriceChange(e.target.value)} className={`${inputClass} ${originalPriceError || discountError ? "border-destructive" : ""}`} />
                {originalPriceError && <p className="text-[10px] text-destructive mt-0.5 px-2">{originalPriceError}</p>}
              </div>
              <div>
                <input placeholder="B2C Discount %" type="number" min="0" max="100" step="0.1" value={b2cPercent} onChange={(e) => handleB2cPercentChange(e.target.value)} className={inputClass} />
                {b2cPercent && <p className="text-[10px] text-primary mt-0.5 px-2">B2C Price: ৳{price.toFixed(2)}</p>}
              </div>
              <div>
                <input placeholder="B2B Discount %" type="number" min="0" max="100" step="0.1" value={b2bPercent} onChange={(e) => handleB2bPercentChange(e.target.value)} className={inputClass} />
                {b2bPercent && form.b2b_price && <p className="text-[10px] text-primary mt-0.5 px-2">B2B Price: ৳{parseFloat(form.b2b_price).toFixed(2)}</p>}
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-2">
              <div>
                <input placeholder="B2C Price (৳) *" type="number" min="0" step="0.01" value={form.price} onChange={(e) => { setForm({ ...form, price: e.target.value }); setB2cPercent(""); }} className={`${inputClass} ${priceError ? "border-destructive" : ""}`} required />
                {priceError && <p className="text-[10px] text-destructive mt-0.5 px-2">{priceError}</p>}
                {discountError && <p className="text-[10px] text-destructive mt-0.5 px-2">{discountError}</p>}
              </div>
              <div>
                <input placeholder="B2B Price (৳)" type="number" min="0" step="0.01" value={form.b2b_price} onChange={(e) => { setForm({ ...form, b2b_price: e.target.value }); setB2bPercent(""); }} className={inputClass} />
              </div>
              <input placeholder="Stock" type="number" min="0" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} className={inputClass} />
            </div>
            {discountedDisplay && (
              <p className="text-xs text-primary font-semibold px-1">💰 Discounted: {discountedDisplay}</p>
            )}
          </div>

          {/* Company & Category */}
          <div className="space-y-1">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Company & Category</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <CompanyCombobox value={form.company} onChange={v => setForm({ ...form, company: v })} companies={companyList} />
              <select className={inputClass} value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })}>
                <option value="">Select Category</option>
                {categories?.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </div>

          {/* Delivery & Prescription */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input placeholder="Delivery Time (e.g. 12-24 Hours)" value={form.delivery_time} onChange={(e) => setForm({ ...form, delivery_time: e.target.value })} className={inputClass} />
            <label className="flex items-center gap-2 text-sm text-foreground px-4 py-3 rounded-2xl border border-border bg-secondary/30 cursor-pointer">
              <input type="checkbox" checked={form.requires_prescription} onChange={(e) => setForm({ ...form, requires_prescription: e.target.checked })} className="rounded accent-primary w-4 h-4" />
              Requires Prescription (Rx)
            </label>
          </div>

          {/* Image */}
          <div className="space-y-1">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Product Image</p>
            <ImageUploader value={form.image_url} onChange={v => setForm({ ...form, image_url: v })} />
          </div>

          {/* Description */}
          <div className="space-y-1">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Description</p>
            <RichTextEditor value={form.description} onChange={v => setForm({ ...form, description: v })} />
          </div>

          {/* SEO */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">SEO</p>
              <button
                type="button"
                onClick={handleAiGenerate}
                disabled={aiGenerating || !form.name.trim()}
                className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors disabled:opacity-50"
              >
                {aiGenerating ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                {aiGenerating ? "Generating..." : "AI Generate SEO + Description"}
              </button>
            </div>
            <div className="grid grid-cols-1 gap-3">
              <div>
                <input placeholder="Slug (URL-friendly)" value={form.slug} onChange={(e) => setForm({ ...form, slug: slugify(e.target.value) })} className={inputClass} />
                <p className="text-[10px] text-muted-foreground mt-0.5 px-2">example.com/products/<strong>{form.slug || "auto-generated"}</strong></p>
              </div>
              <div>
                <input placeholder="Meta Title (max 60 chars)" maxLength={60} value={form.meta_title} onChange={(e) => setForm({ ...form, meta_title: e.target.value })} className={inputClass} />
                <p className="text-[10px] text-muted-foreground mt-0.5 px-2">{form.meta_title.length}/60</p>
              </div>
              <div>
                <textarea placeholder="Meta Description (max 160 chars)" maxLength={160} value={form.meta_description} onChange={(e) => setForm({ ...form, meta_description: e.target.value })} rows={2} className={`${inputClass} resize-none`} />
                <p className="text-[10px] text-muted-foreground mt-0.5 px-2">{form.meta_description.length}/160</p>
              </div>
            </div>
          </div>

          <button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending || !canSave} className="gradient-primary text-primary-foreground text-sm font-semibold px-5 py-2.5 rounded-2xl shadow-ios hover:scale-105 active:scale-95 transition-transform disabled:opacity-50 flex items-center gap-1.5">
            {saveMutation.isPending && <Loader2 className="animate-spin" size={16} />}
            {editId ? "Update" : "Save"}
          </button>
        </div>
      )}

      <div className="bg-card rounded-2xl shadow-ios overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left">
              <th className="px-3 py-3.5 w-10">
                <input type="checkbox" checked={filtered?.length ? selected.size === filtered.length : false} onChange={toggleSelectAll} className="rounded accent-primary w-4 h-4" />
              </th>
              <th className="px-4 py-3.5 text-muted-foreground font-medium text-xs">Product</th>
              <th className="px-4 py-3.5 text-muted-foreground font-medium text-xs">Company</th>
              <th className="px-4 py-3.5 text-muted-foreground font-medium text-xs">Price</th>
              <th className="px-4 py-3.5 text-muted-foreground font-medium text-xs">Discount</th>
              <th className="px-4 py-3.5 text-muted-foreground font-medium text-xs">Stock</th>
              <th className="px-4 py-3.5 text-muted-foreground font-medium text-xs">Category</th>
              <th className="px-4 py-3.5 text-muted-foreground font-medium text-xs">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={8} className="px-4 py-8 text-center"><Loader2 className="animate-spin mx-auto text-primary" size={24} /></td></tr>
            ) : !filtered?.length ? (
              <tr><td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">No products found</td></tr>
            ) : (
              filtered.map((p) => {
                const d = getDiscount(Number(p.price), p.original_price ? Number(p.original_price) : null);
                return (
                  <tr key={p.id} className={`border-b border-border last:border-0 transition-colors ${selected.has(p.id) ? "bg-primary/5" : "hover:bg-muted/30"}`}>
                    <td className="px-3 py-3">
                      <input type="checkbox" checked={selected.has(p.id)} onChange={() => toggleSelect(p.id)} className="rounded accent-primary w-4 h-4" />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {p.image_url ? (
                          <img src={p.image_url} alt={p.name} className="w-10 h-10 rounded-xl object-cover bg-muted" />
                        ) : (
                          <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center"><Image size={16} className="text-muted-foreground" /></div>
                        )}
                        <div>
                          <p className="font-medium text-foreground">{p.name}</p>
                          {((p as any).dosage_form || (p as any).strength) && (
                            <p className="text-[11px] text-muted-foreground">
                              {(p as any).dosage_form}{(p as any).dosage_form && (p as any).strength ? "-" : ""}{(p as any).strength ? `(${(p as any).strength})` : ""}
                            </p>
                          )}
                          <div className="flex items-center gap-1">
                            {p.requires_prescription && <span className="text-[10px] text-accent font-bold">Rx</span>}
                            {p.stock <= 10 && p.stock > 0 && <span className="text-[10px] text-amber-600 font-bold">Low</span>}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{p.company || "—"}</td>
                    <td className="px-4 py-3">
                      <div>
                        <span className="font-semibold text-foreground">৳{p.price}</span>
                        {p.original_price && <span className="text-xs text-muted-foreground line-through ml-1">৳{p.original_price}</span>}
                      </div>
                      {(p as any).b2b_price && (
                        <p className="text-[10px] text-primary font-medium">B2B: ৳{(p as any).b2b_price}</p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {d > 0 ? (
                        <span className="text-xs font-bold px-2 py-0.5 rounded-xl bg-destructive/10 text-destructive">{d}%</span>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-xl ${
                        p.stock === 0 ? "bg-destructive/15 text-destructive" :
                        p.stock <= 10 ? "bg-amber-500/15 text-amber-600" :
                        "text-foreground"
                      }`}>
                        {p.stock}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{(p as any).categories?.name || "—"}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <a href={`/product/${(p as any).slug || p.id}`} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-xl hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"><Eye size={14} /></a>
                        <button onClick={() => startEdit(p)} className="p-1.5 rounded-xl hover:bg-secondary transition-colors"><Pencil size={14} /></button>
                        <button onClick={() => { if (confirm("Delete this product?")) deleteMutation.mutate(p.id); }} className="p-1.5 rounded-xl hover:bg-destructive/10 text-destructive transition-colors"><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-1">
          <p className="text-xs text-muted-foreground">
            Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, totalCount)} of {totalCount}
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0}
              className="p-2 rounded-xl hover:bg-secondary transition-colors disabled:opacity-30"
            >
              <ChevronLeft size={16} />
            </button>
            {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
              let pageNum: number;
              if (totalPages <= 7) {
                pageNum = i;
              } else if (page < 3) {
                pageNum = i;
              } else if (page > totalPages - 4) {
                pageNum = totalPages - 7 + i;
              } else {
                pageNum = page - 3 + i;
              }
              return (
                <button
                  key={pageNum}
                  onClick={() => setPage(pageNum)}
                  className={`w-8 h-8 rounded-xl text-xs font-medium transition-colors ${
                    page === pageNum
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-secondary text-muted-foreground"
                  }`}
                >
                  {pageNum + 1}
                </button>
              );
            })}
            <button
              onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="p-2 rounded-xl hover:bg-secondary transition-colors disabled:opacity-30"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminProducts;
