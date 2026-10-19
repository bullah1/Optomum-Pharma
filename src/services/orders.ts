/**
 * Order service layer
 */
import { supabase } from "./api";

export async function getUserOrders(userId: string) {
  const { data, error } = await supabase
    .from("orders")
    .select("*, order_items(*, medicines(name, image_url))")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function getOrderById(orderId: string) {
  const { data, error } = await supabase
    .from("orders")
    .select("*, order_items(*, medicines(name, image_url, price)), delivery_zones(area, estimated_time)")
    .eq("id", orderId)
    .single();
  if (error) throw error;
  return data;
}

export async function createOrder(order: {
  user_id: string;
  delivery_address: string;
  total_amount: number;
  delivery_charge: number;
  delivery_zone_id?: string;
  prescription_id?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
  device_type?: string;
  first_visit_id?: string;
  last_visit_id?: string;
}) {
  const { data, error } = await supabase
    .from("orders")
    .insert(order)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function createOrderItems(
  items: { order_id: string; medicine_id: string; quantity: number; price: number }[]
) {
  const { error } = await supabase.from("order_items").insert(items);
  if (error) throw error;
}
