/**
 * Auth / Profile service layer
 */
import { supabase } from "./api";

export async function getProfile(userId: string) {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();
  if (error) throw error;
  return data;
}

export async function updateProfile(userId: string, values: Record<string, unknown>) {
  const { data, error } = await supabase
    .from("profiles")
    .update(values)
    .eq("id", userId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function checkUserRole(userId: string, role: string) {
  const { data, error } = await supabase.rpc("has_role", {
    _user_id: userId,
    _role: role as "admin" | "user" | "b2b" | "rider",
  });
  if (error) throw error;
  return !!data;
}

export async function getShippingAddresses(userId: string) {
  const { data, error } = await supabase
    .from("shipping_addresses")
    .select("*")
    .eq("user_id", userId)
    .order("is_default", { ascending: false });
  if (error) throw error;
  return data;
}
