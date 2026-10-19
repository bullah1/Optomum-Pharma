/**
 * Product / Medicine service layer
 */
import { supabase } from "./api";

export interface Medicine {
  id: string;
  name: string;
  name_bn?: string;
  price: number;
  original_price?: number;
  image_url?: string;
  company?: string;
  description?: string;
  category_id?: string;
  stock: number;
  requires_prescription: boolean;
  slug?: string;
  dosage_form?: string;
  strength?: string;
  delivery_time?: string;
  b2b_price?: number;
  meta_title?: string;
  meta_description?: string;
}

export async function getProducts(options?: {
  categoryId?: string;
  search?: string;
  limit?: number;
  offset?: number;
}) {
  // Use prefix-priority search when search term provided
  if (options?.search && options.search.trim().length >= 2) {
    const { data, error } = await (supabase.rpc as any)("search_medicines", {
      q: options.search.trim(),
      cat_id: options.categoryId || null,
      lim: options.limit || 20,
      off: options.offset || 0,
    });
    if (error) throw error;
    return data;
  }

  let query = supabase
    .from("medicines")
    .select("*, categories(name)")
    .order("created_at", { ascending: false });

  if (options?.categoryId) {
    query = query.eq("category_id", options.categoryId);
  }
  if (options?.limit) {
    const from = options.offset || 0;
    query = query.range(from, from + options.limit - 1);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function getProductById(id: string) {
  const { data, error } = await supabase
    .from("medicines")
    .select("*, categories(name)")
    .eq("id", id)
    .single();
  if (error) throw error;
  return data;
}

export async function getProductBySlug(slug: string) {
  const { data, error } = await supabase
    .from("medicines")
    .select("*, categories(name)")
    .eq("slug", slug)
    .single();
  if (error) throw error;
  return data;
}

export async function getCategories() {
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return data;
}
