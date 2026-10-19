import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import PageTopBar from "@/components/PageTopBar";
import MobileBottomNav from "@/components/MobileBottomNav";
import { MapPin, Plus, Trash2, Star, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import ShippingAddressDialog from "@/components/ShippingAddressDialog";
import { toast } from "sonner";

const ManageAddressPage = () => {
  const { user } = useAuth();
  const [addresses, setAddresses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);

  const fetchAddresses = async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from("shipping_addresses")
      .select("*")
      .eq("user_id", user.id)
      .order("is_default", { ascending: false });
    setAddresses(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchAddresses(); }, [user]);

  const deleteAddress = async (id: string) => {
    await supabase.from("shipping_addresses").delete().eq("id", id);
    toast.success("Address deleted");
    fetchAddresses();
  };

  const setDefault = async (id: string) => {
    if (!user) return;
    await supabase.from("shipping_addresses").update({ is_default: false }).eq("user_id", user.id);
    await supabase.from("shipping_addresses").update({ is_default: true }).eq("id", id);
    toast.success("Default address updated");
    fetchAddresses();
  };

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <PageTopBar title="Manage Address" />
      <div className="max-w-lg mx-auto px-4 py-4 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-foreground">Manage Addresses</h2>
          <Button size="sm" onClick={() => setDialogOpen(true)} className="gap-1.5 rounded-xl">
            <Plus size={16} /> Add New
          </Button>
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="animate-spin text-primary" size={24} /></div>
        ) : addresses.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <MapPin size={40} className="mx-auto mb-3 opacity-40" />
            <p>No addresses added yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {addresses.map((addr) => (
              <div key={addr.id} className="bg-card border border-border rounded-xl p-4 space-y-2">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-foreground">{addr.name}</span>
                      <span className="text-xs bg-secondary px-2 py-0.5 rounded-full text-muted-foreground">{addr.address_type}</span>
                      {addr.is_default && <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">Default</span>}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{addr.phone}</p>
                  </div>
                </div>
                <p className="text-sm text-foreground/80">{addr.address}, {addr.upazila && `${addr.upazila}, `}{addr.district}, {addr.division}</p>
                <div className="flex gap-2 pt-1">
                  {!addr.is_default && (
                    <Button variant="outline" size="sm" className="text-xs rounded-xl gap-1" onClick={() => setDefault(addr.id)}>
                      <Star size={12} /> Set Default
                    </Button>
                  )}
                  <Button variant="outline" size="sm" className="text-xs rounded-xl gap-1 text-destructive hover:text-destructive" onClick={() => deleteAddress(addr.id)}>
                    <Trash2 size={12} /> Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <ShippingAddressDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSaved={fetchAddresses}
      />
      <MobileBottomNav />
    </div>
  );
};

export default ManageAddressPage;
