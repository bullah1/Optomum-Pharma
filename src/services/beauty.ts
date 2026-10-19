/**
 * Beauty service layer — Specialists & Appointments
 */
import { supabase } from "./api";

export async function getBeautySpecialists() {
  const { data, error } = await supabase
    .from("beauty_specialists")
    .select("*")
    .eq("available", true)
    .order("name");
  if (error) throw error;
  return data;
}

export async function getBeautySpecialistById(id: string) {
  const { data, error } = await supabase
    .from("beauty_specialists")
    .select("*")
    .eq("id", id)
    .single();
  if (error) throw error;
  return data;
}

export async function getUserBeautyAppointments(userId: string) {
  const { data, error } = await supabase
    .from("beauty_appointments")
    .select("*, beauty_specialists(name, specialization, image_url)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function createBeautyAppointment(appointment: any) {
  const { data, error } = await supabase
    .from("beauty_appointments")
    .insert(appointment)
    .select()
    .single();
  if (error) throw error;
  return data;
}
