import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Save, Globe, Truck, CreditCard, Receipt, Palette, Phone, Webhook, BarChart3 } from "lucide-react";

const inputClass = "w-full px-4 py-3 rounded-2xl border border-border bg-secondary/30 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-muted-foreground/50";

type Settings = Record<string, string>;

const AdminSettings = () => {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<Settings>({});
  const [dirty, setDirty] = useState(false);

  const { data: settings, isLoading } = useQuery({
    queryKey: ["site-settings"],
    queryFn: async () => {
      const { data, error } = await supabase.from("site_settings").select("key, value");
      if (error) throw error;
      const map: Settings = {};
      data?.forEach(s => { map[s.key] = s.value ?? ""; });
      return map;
    },
  });

  useEffect(() => {
    if (settings && Object.keys(form).length === 0) {
      setForm(settings);
    }
  }, [settings]);

  const update = (key: string, value: string) => {
    setForm(prev => ({ ...prev, [key]: value }));
    setDirty(true);
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const entries = Object.entries(form);
      for (const [key, value] of entries) {
        if (settings?.[key] !== value) {
          const { error } = await supabase
            .from("site_settings")
            .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: "key" });
          if (error) throw error;
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["site-settings"] });
      toast.success("Settings saved");
      setDirty(false);
    },
    onError: (e: any) => toast.error(e.message),
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="animate-spin text-primary" size={28} />
      </div>
    );
  }

  const Toggle = ({ settingKey, label }: { settingKey: string; label: string }) => (
    <label className="flex items-center justify-between py-2">
      <span className="text-sm text-foreground">{label}</span>
      <button
        type="button"
        onClick={() => update(settingKey, form[settingKey] === "true" ? "false" : "true")}
        className={`relative w-11 h-6 rounded-full transition-colors ${
          form[settingKey] === "true" ? "bg-primary" : "bg-muted"
        }`}
      >
        <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-primary-foreground rounded-full shadow transition-transform ${
          form[settingKey] === "true" ? "translate-x-5" : ""
        }`} />
      </button>
    </label>
  );

  return (
    <div className="space-y-5 max-w-3xl">
      {/* Save button — sticky */}
      {dirty && (
        <div className="sticky top-16 z-20 flex justify-end">
          <button
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending}
            className="gradient-primary text-primary-foreground text-sm font-semibold px-5 py-2.5 rounded-2xl shadow-ios hover:scale-105 active:scale-95 transition-transform disabled:opacity-50 flex items-center gap-1.5"
          >
            {saveMutation.isPending ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
            Save Changes
          </button>
        </div>
      )}

      {/* General */}
      <section className="bg-card rounded-2xl shadow-ios overflow-hidden">
        <div className="flex items-center gap-2 px-5 py-3.5 border-b border-border">
          <Globe size={16} className="text-primary" />
          <h3 className="text-sm font-bold text-foreground">General</h3>
        </div>
        <div className="p-5 space-y-3">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Site Name</label>
            <input value={form.site_name ?? ""} onChange={e => update("site_name", e.target.value)} placeholder="Your Site Name" className={inputClass} />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Logo URL</label>
            <input value={form.site_logo ?? ""} onChange={e => update("site_logo", e.target.value)} placeholder="https://... logo image URL" className={inputClass} />
            {form.site_logo && (
              <img src={form.site_logo} alt="Logo preview" className="h-12 mt-2 rounded-xl object-contain bg-muted p-1" />
            )}
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Banner Image URL</label>
            <input value={form.site_banner ?? ""} onChange={e => update("site_banner", e.target.value)} placeholder="https://... banner image URL" className={inputClass} />
            {form.site_banner && (
              <img src={form.site_banner} alt="Banner preview" className="h-24 mt-2 rounded-xl object-cover bg-muted w-full" />
            )}
          </div>
        </div>
      </section>

      {/* Contact */}
      <section className="bg-card rounded-2xl shadow-ios overflow-hidden">
        <div className="flex items-center gap-2 px-5 py-3.5 border-b border-border">
          <Phone size={16} className="text-primary" />
          <h3 className="text-sm font-bold text-foreground">Contact Info</h3>
        </div>
        <div className="p-5 space-y-3">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Phone Number</label>
            <input value={form.contact_phone ?? ""} onChange={e => update("contact_phone", e.target.value)} placeholder="+880..." className={inputClass} />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Email</label>
            <input value={form.contact_email ?? ""} onChange={e => update("contact_email", e.target.value)} placeholder="contact@example.com" className={inputClass} />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Address</label>
            <input value={form.contact_address ?? ""} onChange={e => update("contact_address", e.target.value)} placeholder="Your store address" className={inputClass} />
          </div>
        </div>
      </section>

      {/* Delivery */}
      <section className="bg-card rounded-2xl shadow-ios overflow-hidden">
        <div className="flex items-center gap-2 px-5 py-3.5 border-b border-border">
          <Truck size={16} className="text-primary" />
          <h3 className="text-sm font-bold text-foreground">Delivery</h3>
        </div>
        <div className="p-5 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Default Delivery Charge (৳)</label>
              <input type="number" value={form.default_delivery_charge ?? ""} onChange={e => update("default_delivery_charge", e.target.value)} placeholder="60" className={inputClass} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Free Delivery Minimum (৳)</label>
              <input type="number" value={form.free_delivery_min ?? ""} onChange={e => update("free_delivery_min", e.target.value)} placeholder="500" className={inputClass} />
            </div>
          </div>
        </div>
      </section>

      {/* Payment Methods */}
      <section className="bg-card rounded-2xl shadow-ios overflow-hidden">
        <div className="flex items-center gap-2 px-5 py-3.5 border-b border-border">
          <CreditCard size={16} className="text-primary" />
          <h3 className="text-sm font-bold text-foreground">Payment Methods</h3>
        </div>
        <div className="p-5 space-y-1 divide-y divide-border/40">
          <Toggle settingKey="payment_bkash" label="bKash" />
          <Toggle settingKey="payment_nagad" label="Nagad" />
          <Toggle settingKey="payment_card" label="Card Payment" />
          <Toggle settingKey="payment_cod" label="Cash on Delivery" />
        </div>
      </section>

      {/* Tax / VAT */}
      <section className="bg-card rounded-2xl shadow-ios overflow-hidden">
        <div className="flex items-center gap-2 px-5 py-3.5 border-b border-border">
          <Receipt size={16} className="text-primary" />
          <h3 className="text-sm font-bold text-foreground">Tax / VAT</h3>
        </div>
        <div className="p-5 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Tax (%)</label>
              <input type="number" value={form.tax_percent ?? ""} onChange={e => update("tax_percent", e.target.value)} placeholder="0" className={inputClass} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">VAT (%)</label>
              <input type="number" value={form.vat_percent ?? ""} onChange={e => update("vat_percent", e.target.value)} placeholder="0" className={inputClass} />
            </div>
          </div>
        </div>
      </section>

      {/* Appearance */}
      <section className="bg-card rounded-2xl shadow-ios overflow-hidden">
        <div className="flex items-center gap-2 px-5 py-3.5 border-b border-border">
          <Palette size={16} className="text-primary" />
          <h3 className="text-sm font-bold text-foreground">Appearance</h3>
        </div>
        <div className="p-5 space-y-1">
          <Toggle settingKey="dark_mode_default" label="Dark Mode Default" />
        </div>
      </section>

      {/* Zapier Webhook */}
      <section className="bg-card rounded-2xl shadow-ios overflow-hidden">
        <div className="flex items-center gap-2 px-5 py-3.5 border-b border-border">
          <Webhook size={16} className="text-primary" />
          <h3 className="text-sm font-bold text-foreground">Zapier Webhook (SMS/Email)</h3>
        </div>
        <div className="p-5 space-y-3">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Webhook URL</label>
            <input value={form.zapier_webhook_url ?? ""} onChange={e => update("zapier_webhook_url", e.target.value)} placeholder="https://hooks.zapier.com/hooks/catch/..." className={inputClass} />
          </div>
          <div className="bg-secondary/40 rounded-xl p-3 space-y-1.5">
            <p className="text-xs font-semibold text-foreground">📌 সেটআপ গাইড:</p>
            <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
              <li>Zapier এ গিয়ে নতুন Zap তৈরি করুন</li>
              <li>Trigger হিসেবে <strong>"Webhooks by Zapier" → "Catch Hook"</strong> সিলেক্ট করুন</li>
              <li>Webhook URL কপি করে এখানে পেস্ট করুন</li>
              <li>Action হিসেবে SMS (Twilio/Vonage) বা Email সিলেক্ট করুন</li>
            </ol>
            <p className="text-[10px] text-muted-foreground/70 mt-2">
              Webhook পাঠাবে: event_type, reference_number, status, status_label, user_name, user_phone, user_email
            </p>
          </div>
        </div>
      </section>

      {/* Pixel & GA4 */}
      <section className="bg-card rounded-2xl shadow-ios overflow-hidden">
        <div className="flex items-center gap-2 px-5 py-3.5 border-b border-border">
          <BarChart3 size={16} className="text-primary" />
          <h3 className="text-sm font-bold text-foreground">Tracking Pixels</h3>
        </div>
        <div className="p-5 space-y-3">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Facebook Pixel ID</label>
            <input value={form.facebook_pixel_id ?? ""} onChange={e => update("facebook_pixel_id", e.target.value)} placeholder="e.g. 1234567890" className={inputClass} />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">GA4 Measurement ID</label>
            <input value={form.ga4_measurement_id ?? ""} onChange={e => update("ga4_measurement_id", e.target.value)} placeholder="e.g. G-XXXXXXXXXX" className={inputClass} />
          </div>
          <div className="bg-secondary/40 rounded-xl p-3 space-y-1">
            <p className="text-xs font-semibold text-foreground">📌 কিভাবে পাবেন?</p>
            <p className="text-[10px] text-muted-foreground">• Facebook Pixel: Events Manager → Data Sources → Pixel ID কপি করুন</p>
            <p className="text-[10px] text-muted-foreground">• GA4: Admin → Data Streams → Measurement ID কপি করুন</p>
          </div>
        </div>
      </section>

      {/* Bottom save */}
      {dirty && (
        <button
          onClick={() => saveMutation.mutate()}
          disabled={saveMutation.isPending}
          className="w-full gradient-primary text-primary-foreground text-sm font-semibold py-3 rounded-2xl shadow-ios hover:scale-[1.02] active:scale-[0.98] transition-transform disabled:opacity-50 flex items-center justify-center gap-1.5"
        >
          {saveMutation.isPending ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
          Save All Changes
        </button>
      )}
    </div>
  );
};

export default AdminSettings;
