import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { getDivisions, getDistricts, getUpazilas, getDeliveryCharge } from "@/data/bangladeshLocations";
import { MapPin, Home, Building2, TreePine, Loader2 } from "lucide-react";

export interface ShippingAddress {
  id: string;
  name: string;
  phone: string;
  division: string;
  district: string;
  upazila: string | null;
  address: string;
  address_type: string;
  is_default: boolean;
  delivery_charge: number;
}

interface ShippingAddressDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: (address: ShippingAddress) => void;
  editAddress?: ShippingAddress | null;
}

const addressTypes = [
  { id: "home", label: "Home", icon: Home },
  { id: "office", label: "Office", icon: Building2 },
  { id: "hometown", label: "Hometown", icon: TreePine },
];

const ShippingAddressDialog = ({ open, onOpenChange, onSaved, editAddress }: ShippingAddressDialogProps) => {
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    division: "",
    district: "",
    upazila: "",
    address: "",
    address_type: "home",
    is_default: false,
  });

  // Populate form when editing
  useEffect(() => {
    if (editAddress && open) {
      setForm({
        name: editAddress.name,
        phone: editAddress.phone,
        division: editAddress.division,
        district: editAddress.district,
        upazila: editAddress.upazila || "",
        address: editAddress.address,
        address_type: editAddress.address_type,
        is_default: editAddress.is_default,
      });
    } else if (!open) {
      setForm({ name: "", phone: "", division: "", district: "", upazila: "", address: "", address_type: "home", is_default: false });
    }
  }, [editAddress, open]);

  const divisions = getDivisions();
  const districts = getDistricts(form.division);
  const upazilas = getUpazilas(form.division, form.district);
  const deliveryCharge = form.division && form.district ? getDeliveryCharge(form.division, form.district) : 0;

  // Reset cascading when parent changes
  useEffect(() => {
    setForm((f) => ({ ...f, district: "", upazila: "" }));
  }, [form.division]);

  useEffect(() => {
    setForm((f) => ({ ...f, upazila: "" }));
  }, [form.district]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error("Please login first");
      return;
    }
    if (!form.name.trim() || !form.phone.trim() || !form.division || !form.district || !form.address.trim()) {
      toast.error("Please fill all required fields");
      return;
    }

    setSaving(true);
    try {
      // If default, unset others
      if (form.is_default) {
        await supabase
          .from("shipping_addresses")
          .update({ is_default: false } as any)
          .eq("user_id", user.id);
      }

      let data, error;
      const payload = {
        user_id: user.id,
        name: form.name.trim(),
        phone: form.phone.trim(),
        division: form.division,
        district: form.district,
        upazila: form.upazila || null,
        address: form.address.trim(),
        address_type: form.address_type,
        is_default: form.is_default,
        delivery_charge: deliveryCharge,
      };

      if (editAddress) {
        const res = await supabase
          .from("shipping_addresses")
          .update(payload as any)
          .eq("id", editAddress.id)
          .select()
          .single();
        data = res.data;
        error = res.error;
      } else {
        const res = await supabase
          .from("shipping_addresses")
          .insert(payload as any)
          .select()
          .single();
        data = res.data;
        error = res.error;
      }

      if (error) throw error;

      toast.success(editAddress ? "Address updated!" : "Address saved!");
      onSaved(data as any);
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to save address");
    } finally {
      setSaving(false);
    }
  };

  const selectClass = "w-full px-4 py-3 rounded-2xl border border-border bg-secondary/30 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-foreground appearance-none";
  const inputClass = "w-full px-4 py-3 rounded-2xl border border-border bg-secondary/30 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-muted-foreground/50";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto rounded-3xl p-0">
        <DialogHeader className="px-5 pt-5 pb-3 border-b border-border">
          <DialogTitle className="flex items-center gap-2 text-base font-bold">
            <MapPin size={18} className="text-primary" />
            {editAddress ? "Edit Address" : "Add Shipping Address"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSave} className="px-5 pb-5 space-y-4">
          {/* Name */}
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1.5">
              Full Name <span className="text-destructive">*</span>
            </label>
            <input
              required
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className={inputClass}
              placeholder="Enter full name"
              maxLength={100}
            />
          </div>

          {/* Phone */}
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1.5">
              Phone Number <span className="text-destructive">*</span>
            </label>
            <input
              required
              type="tel"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className={inputClass}
              placeholder="01XXXXXXXXX"
              maxLength={15}
            />
          </div>

          {/* Division */}
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1.5">
              Division <span className="text-destructive">*</span>
            </label>
            <select
              required
              value={form.division}
              onChange={(e) => setForm({ ...form, division: e.target.value })}
              className={selectClass}
            >
              <option value="">Select Division</option>
              {divisions.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          {/* District */}
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1.5">
              District <span className="text-destructive">*</span>
            </label>
            <select
              required
              value={form.district}
              onChange={(e) => setForm({ ...form, district: e.target.value })}
              className={selectClass}
              disabled={!form.division}
            >
              <option value="">Select District</option>
              {districts.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          {/* Upazila */}
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1.5">
              Upazila / Area
            </label>
            <select
              value={form.upazila}
              onChange={(e) => setForm({ ...form, upazila: e.target.value })}
              className={selectClass}
              disabled={!form.district}
            >
              <option value="">Select Upazila</option>
              {upazilas.map((u) => (
                <option key={u} value={u}>{u}</option>
              ))}
            </select>
          </div>

          {/* Address */}
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1.5">
              Address <span className="text-destructive">*</span>
            </label>
            <textarea
              required
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              rows={2}
              className={`${inputClass} resize-none`}
              placeholder="House, Flat No, Road"
              maxLength={500}
            />
          </div>

          {/* Delivery Charge Preview */}
          {form.division && (
            <div className="flex items-center justify-between px-4 py-2.5 rounded-2xl bg-primary/5 border border-primary/20">
              <span className="text-xs text-muted-foreground">Delivery Charge</span>
              <span className="text-sm font-bold text-primary">৳{deliveryCharge}</span>
            </div>
          )}

          {/* Address Type */}
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-2">Address Type</label>
            <div className="flex gap-2">
              {addressTypes.map((type) => {
                const Icon = type.icon;
                return (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => setForm({ ...form, address_type: type.id })}
                    className={`flex items-center gap-1.5 px-4 py-2.5 rounded-2xl border-2 text-xs font-medium transition-all ${
                      form.address_type === type.id
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-border text-muted-foreground hover:border-primary/30"
                    }`}
                  >
                    <Icon size={14} />
                    {type.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Default toggle */}
          <label className="flex items-center justify-between cursor-pointer">
            <span className="text-sm text-foreground">Make default address</span>
            <button
              type="button"
              onClick={() => setForm({ ...form, is_default: !form.is_default })}
              className={`w-11 h-6 rounded-full transition-colors relative ${
                form.is_default ? "bg-primary" : "bg-muted"
              }`}
            >
              <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
                form.is_default ? "left-[22px]" : "left-0.5"
              }`} />
            </button>
          </label>

          {/* Save Button */}
          <button
            type="submit"
            disabled={saving}
            className="w-full gradient-accent text-accent-foreground py-3 rounded-2xl font-semibold text-sm shadow-ios hover:scale-[1.02] active:scale-[0.98] transition-transform disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {saving && <Loader2 className="animate-spin" size={16} />}
            {saving ? "Saving..." : editAddress ? "Update Address" : "Save Address"}
          </button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ShippingAddressDialog;
