/**
 * Healthcare service layer — Doctors, Lab Tests, Appointments
 */
import { supabase } from "./api";

// ── Doctors ──
export async function getDoctors() {
  const { data, error } = await supabase
    .from("doctors")
    .select("*")
    .eq("available", true)
    .order("name");
  if (error) throw error;
  return data;
}

export async function getDoctorById(id: string) {
  const { data, error } = await supabase.from("doctors").select("*").eq("id", id).single();
  if (error) throw error;
  return data;
}

// ── Doctor Appointments ──
export async function getUserAppointments(userId: string) {
  const { data, error } = await supabase
    .from("doctor_appointments")
    .select("*, doctors(name, specialization, image_url)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function createDoctorAppointment(appointment: any) {
  const { data, error } = await supabase
    .from("doctor_appointments")
    .insert(appointment)
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ── Lab Tests ──
export async function getLabTests() {
  const { data, error } = await supabase
    .from("lab_tests")
    .select("*")
    .eq("available", true)
    .order("name");
  if (error) throw error;
  return data;
}

export async function getLabPackages() {
  const { data, error } = await supabase
    .from("lab_packages")
    .select("*")
    .eq("active", true)
    .order("sort_order");
  if (error) throw error;
  return data;
}

// ── Lab Bookings ──
export async function getUserLabBookings(userId: string) {
  const { data, error } = await supabase
    .from("lab_bookings")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function createLabBooking(booking: any) {
  const { data, error } = await supabase
    .from("lab_bookings")
    .insert(booking)
    .select()
    .single();
  if (error) throw error;
  return data;
}
