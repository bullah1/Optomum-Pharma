import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, X, Loader2 } from "lucide-react";
import ImageUploader from "@/components/admin/ImageUploader";

const inputClass =
  "w-full px-4 py-3 rounded-2xl border border-border bg-secondary/30 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-muted-foreground/50";

const emptyForm = {
  name: "",
  designation: "",
  specialization: "",
  fee: "",
  schedule: "",
  image_url: "",
  available: true,
  bio: "",
  qualifications: "",
  bmdc_number: "",
  education: "",
  experience_years: "",
  chamber_name: "",
  chamber_address: "",
  chamber_map_url: "",
  visit_days: "",
  visit_time: "",
  languages: "",
};

const AdminDoctors = () => {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  const { data: doctors, isLoading } = useQuery({
    queryKey: ["admin-doctors"],
    queryFn: async () => {
      const { data, error } = await supabase.from("doctors").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload: any = {
        name: form.name,
        designation: form.designation || null,
        specialization: form.specialization || null,
        fee: Number(form.fee),
        schedule: form.schedule || null,
        image_url: form.image_url || null,
        available: form.available,
        bio: form.bio || null,
        qualifications: form.qualifications || null,
        bmdc_number: form.bmdc_number || null,
        education: form.education || null,
        experience_years: form.experience_years ? Number(form.experience_years) : null,
        chamber_name: form.chamber_name || null,
        chamber_address: form.chamber_address || null,
        chamber_map_url: form.chamber_map_url || null,
        visit_days: form.visit_days || null,
        visit_time: form.visit_time || null,
        languages: form.languages || null,
      };
      if (editId) {
        const { error } = await supabase.from("doctors").update(payload).eq("id", editId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("doctors").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-doctors"] });
      toast.success(editId ? "Doctor updated" : "Doctor added");
      resetForm();
    },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("doctors").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-doctors"] });
      toast.success("Doctor deleted");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const resetForm = () => {
    setShowForm(false);
    setEditId(null);
    setForm(emptyForm);
  };

  const startEdit = (d: any) => {
    setEditId(d.id);
    setForm({
      name: d.name,
      designation: d.designation || "",
      specialization: d.specialization || "",
      fee: String(d.fee),
      schedule: d.schedule || "",
      image_url: d.image_url || "",
      available: d.available,
      bio: d.bio || "",
      qualifications: d.qualifications || "",
      bmdc_number: d.bmdc_number || "",
      education: d.education || "",
      experience_years: d.experience_years ? String(d.experience_years) : "",
      chamber_name: d.chamber_name || "",
      chamber_address: d.chamber_address || "",
      chamber_map_url: d.chamber_map_url || "",
      visit_days: d.visit_days || "",
      visit_time: d.visit_time || "",
      languages: d.languages || "",
    });
    setShowForm(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{doctors?.length ?? 0} doctors</p>
        <button
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
          className="gradient-accent text-accent-foreground text-sm font-semibold px-4 py-2 rounded-2xl shadow-ios hover:scale-105 active:scale-95 transition-transform flex items-center gap-1.5"
        >
          <Plus size={16} /> New Doctor
        </button>
      </div>

      {showForm && (
        <div className="bg-card rounded-2xl shadow-ios p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-foreground">{editId ? "Edit Doctor" : "New Doctor"}</h4>
            <button onClick={resetForm} className="p-1.5 rounded-full bg-muted text-muted-foreground hover:text-foreground">
              <X size={16} />
            </button>
          </div>

          {/* Photo */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 block">
              Doctor Photo
            </label>
            <ImageUploader
              value={form.image_url}
              onChange={(url) => setForm({ ...form, image_url: url })}
            />
          </div>

          {/* Basic */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 block">
              Basic Info
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input placeholder="Doctor Name *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputClass} required />
              <input placeholder="Designation (e.g. Associate Professor)" value={form.designation} onChange={(e) => setForm({ ...form, designation: e.target.value })} className={inputClass} />
              <input placeholder="Specialization (e.g. Cardiologist)" value={form.specialization} onChange={(e) => setForm({ ...form, specialization: e.target.value })} className={inputClass} />
              <input placeholder="Fee (৳) *" type="number" value={form.fee} onChange={(e) => setForm({ ...form, fee: e.target.value })} className={inputClass} required />
              <input placeholder="Qualifications (MBBS, FCPS)" value={form.qualifications} onChange={(e) => setForm({ ...form, qualifications: e.target.value })} className={inputClass} />
              <input placeholder="BMDC Reg. Number" value={form.bmdc_number} onChange={(e) => setForm({ ...form, bmdc_number: e.target.value })} className={inputClass} />
              <input placeholder="Education (Dhaka Medical College)" value={form.education} onChange={(e) => setForm({ ...form, education: e.target.value })} className={inputClass} />
              <input placeholder="Experience (years)" type="number" value={form.experience_years} onChange={(e) => setForm({ ...form, experience_years: e.target.value })} className={inputClass} />
              <input placeholder="Languages (Bangla, English)" value={form.languages} onChange={(e) => setForm({ ...form, languages: e.target.value })} className={`${inputClass} sm:col-span-2`} />
            </div>
          </div>

          {/* Chamber */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 block">
              Chamber & Visit Time
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input placeholder="Chamber name (e.g. Bangladesh Medical College Hospital)" value={form.chamber_name} onChange={(e) => setForm({ ...form, chamber_name: e.target.value })} className={`${inputClass} sm:col-span-2`} />
              <input placeholder="Chamber full address" value={form.chamber_address} onChange={(e) => setForm({ ...form, chamber_address: e.target.value })} className={`${inputClass} sm:col-span-2`} />
              <input placeholder="Visit days (e.g. Sat-Thu)" value={form.visit_days} onChange={(e) => setForm({ ...form, visit_days: e.target.value })} className={inputClass} />
              <input placeholder="Visit time (e.g. 5PM-9PM)" value={form.visit_time} onChange={(e) => setForm({ ...form, visit_time: e.target.value })} className={inputClass} />
              <input placeholder="Schedule notes (optional, free text)" value={form.schedule} onChange={(e) => setForm({ ...form, schedule: e.target.value })} className={`${inputClass} sm:col-span-2`} />
              <input placeholder="Google Maps link (https://maps.google.com/...)" value={form.chamber_map_url} onChange={(e) => setForm({ ...form, chamber_map_url: e.target.value })} className={`${inputClass} sm:col-span-2`} />
            </div>
          </div>

          {/* Bio */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 block">
              About Doctor (SEO)
            </label>
            <textarea
              placeholder="Bio / About doctor — boosts SEO ranking"
              value={form.bio}
              onChange={(e) => setForm({ ...form, bio: e.target.value })}
              rows={4}
              className={`${inputClass} resize-none`}
            />
          </div>

          <label className="flex items-center gap-2 text-sm text-foreground px-2">
            <input type="checkbox" checked={form.available} onChange={(e) => setForm({ ...form, available: e.target.checked })} className="rounded" />
            Available
          </label>

          <button
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending || !form.name || !form.fee}
            className="gradient-primary text-primary-foreground text-sm font-semibold px-5 py-2.5 rounded-2xl shadow-ios hover:scale-105 active:scale-95 transition-transform disabled:opacity-50 flex items-center gap-1.5"
          >
            {saveMutation.isPending && <Loader2 className="animate-spin" size={16} />}
            {editId ? "Update" : "Save"}
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {isLoading ? (
          <div className="col-span-full flex justify-center py-12">
            <Loader2 className="animate-spin text-primary" size={28} />
          </div>
        ) : !doctors?.length ? (
          <div className="col-span-full text-center py-8 text-muted-foreground">No doctors found</div>
        ) : (
          doctors.map((d) => (
            <div key={d.id} className="bg-card rounded-2xl shadow-ios p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-foreground truncate">{d.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{d.specialization || "—"}</p>
                  {d.slug && <p className="text-[10px] text-primary/70 truncate mt-0.5">/doctor/{d.slug}</p>}
                </div>
                <span className={`text-xs font-medium px-2.5 py-1 rounded-xl shrink-0 ${d.available ? "bg-success/15 text-success" : "bg-muted text-muted-foreground"}`}>
                  {d.available ? "Available" : "Unavailable"}
                </span>
              </div>
              <p className="text-sm text-foreground font-semibold">৳{d.fee}</p>
              {d.chamber_name && <p className="text-xs text-muted-foreground mt-1 truncate">🏥 {d.chamber_name}</p>}
              {(d.visit_days || d.visit_time) && (
                <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
                  🕒 {d.visit_days} {d.visit_time}
                </p>
              )}
              <div className="flex items-center gap-1 mt-3 pt-2.5 border-t border-border">
                <button onClick={() => startEdit(d)} className="p-1.5 rounded-xl hover:bg-secondary transition-colors">
                  <Pencil size={14} />
                </button>
                <button onClick={() => { if (confirm("Delete?")) deleteMutation.mutate(d.id); }} className="p-1.5 rounded-xl hover:bg-destructive/10 text-destructive transition-colors">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AdminDoctors;
