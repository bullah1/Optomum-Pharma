import { useCart } from "@/contexts/CartContext";
import { Minus, Plus, Trash2, ShoppingBag, ArrowLeft, Truck, Tag, MapPin, ChevronRight, Zap, X, Pencil, AlertTriangle, FlaskConical, ShieldCheck, Pill } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import PageTopBar from "@/components/PageTopBar";
import MobileBottomNav from "@/components/MobileBottomNav";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import ShippingAddressDialog, { type ShippingAddress } from "@/components/ShippingAddressDialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useQuery } from "@tanstack/react-query";

const CartPage = () => {
  const { items, removeItem, updateQuantity, clearCart, totalItems, totalPrice } = useCart();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [couponOpen, setCouponOpen] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [addressDialogOpen, setAddressDialogOpen] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState<ShippingAddress | null>(null);
  const [editingAddress, setEditingAddress] = useState<ShippingAddress | null>(null);
  const [deletingAddress, setDeletingAddress] = useState<ShippingAddress | null>(null);

  const { data: savedAddresses, refetch: refetchAddresses } = useQuery({
    queryKey: ["shipping-addresses", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("shipping_addresses")
        .select("*")
        .eq("user_id", user.id)
        .order("is_default", { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as ShippingAddress[];
    },
    enabled: !!user,
  });

  useEffect(() => {
    if (savedAddresses?.length && !selectedAddress) {
      const defaultAddr = savedAddresses.find((a) => a.is_default) || savedAddresses[0];
      setSelectedAddress(defaultAddr);
    }
  }, [savedAddresses, selectedAddress]);

  const handleAddressSaved = (addr: ShippingAddress) => {
    setSelectedAddress(addr);
    setEditingAddress(null);
    refetchAddresses();
  };

  const handleEditAddress = (addr: ShippingAddress, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingAddress(addr);
    setAddressDialogOpen(true);
  };

  const handleDeleteAddress = async (addr: ShippingAddress, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setDeletingAddress(addr);
  };

  const confirmDeleteAddress = async () => {
    if (!deletingAddress) return;
    const { error } = await supabase.from("shipping_addresses").delete().eq("id", deletingAddress.id);
    if (error) {
      toast.error("Failed to delete address");
    } else {
      toast.success("Address deleted");
      if (selectedAddress?.id === deletingAddress.id) setSelectedAddress(null);
      refetchAddresses();
    }
    setDeletingAddress(null);
  };

  const originalTotal = items.reduce((sum, item) => {
    const orig = item.original_price || item.price;
    return sum + orig * item.quantity;
  }, 0);
  const discount = originalTotal - totalPrice;
  const deliveryCharge = selectedAddress?.delivery_charge ?? 0;
  const grandTotal = totalPrice + deliveryCharge;

  const productItems = items.filter(i => !i.item_type || i.item_type === "product");
  const labItems = items.filter(i => i.item_type === "lab_test" || i.item_type === "lab_package");

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-background pb-16 md:pb-0">
        <main className="container py-20 flex flex-col items-center justify-center gap-4">
          <div className="w-20 h-20 rounded-full bg-secondary/50 flex items-center justify-center">
            <ShoppingBag size={32} className="text-muted-foreground/40" />
          </div>
          <h2 className="text-lg font-bold text-foreground">Cart is Empty</h2>
          <p className="text-sm text-muted-foreground text-center">You have no items in your cart</p>
          <Link to="/" className="bg-primary text-primary-foreground px-8 py-3 rounded-xl font-semibold text-sm active:scale-95 transition-transform">
            Start Shopping
          </Link>
        </main>
        <MobileBottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-32 md:pb-8">
      <main className="container py-3 max-w-3xl space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button onClick={() => navigate(-1)} className="p-2 rounded-xl hover:bg-secondary transition-colors">
              <ArrowLeft size={18} />
            </button>
            <div>
              <h2 className="text-base font-bold text-foreground">Shopping Cart</h2>
              <p className="text-[10px] text-muted-foreground">{totalItems} items</p>
            </div>
          </div>
          <button onClick={clearCart} className="text-[11px] text-destructive font-medium px-3 py-1.5 rounded-lg hover:bg-destructive/5 transition-colors">
            Clear All
          </button>
        </div>

        {/* Medicine Items */}
        {productItems.length > 0 && (
          <section className="space-y-2">
            <div className="flex items-center gap-1.5 px-1">
              <Pill size={14} className="text-primary" />
              <h3 className="text-xs font-bold text-foreground">Medicine ({productItems.length})</h3>
            </div>
            {productItems.map((item) => (
              <div key={item.id} className="bg-card rounded-2xl border border-border p-3">
                <div className="flex gap-3">
                  <div className="w-16 h-16 bg-secondary/40 rounded-xl flex items-center justify-center shrink-0 overflow-hidden">
                    {item.image_url ? (
                      <img src={item.image_url} alt={item.name} className="w-full h-full object-contain p-1.5" />
                    ) : (
                      <Pill size={24} className="text-muted-foreground/30" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-[13px] font-semibold text-foreground line-clamp-2 leading-tight">{item.name}</h4>
                    {item.company && <p className="text-[10px] text-muted-foreground mt-0.5">{item.company}</p>}
                    <div className="flex items-center justify-between mt-2.5">
                      <div>
                        <span className="text-sm font-bold text-primary">৳{item.price}</span>
                        {item.original_price && item.original_price > item.price && (
                          <span className="text-[10px] text-muted-foreground line-through ml-1">৳{item.original_price}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2.5">
                        {/* Quantity Control */}
                        <div className="flex items-center bg-secondary/60 rounded-full overflow-hidden">
                          <button
                            onClick={() => item.quantity <= 1 ? removeItem(item.id) : updateQuantity(item.id, item.quantity - 1)}
                            className="w-8 h-8 flex items-center justify-center hover:bg-secondary active:bg-muted transition-colors"
                          >
                            {item.quantity <= 1 ? <Trash2 size={12} className="text-destructive" /> : <Minus size={13} />}
                          </button>
                          <span className="text-xs font-bold w-7 text-center text-foreground">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="w-8 h-8 flex items-center justify-center hover:bg-secondary active:bg-muted transition-colors"
                          >
                            <Plus size={13} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </section>
        )}

        {/* Lab Test Items */}
        {labItems.length > 0 && (
          <section className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-1.5">
                <FlaskConical size={14} className="text-primary" />
                <h3 className="text-xs font-bold text-foreground">Lab Tests ({labItems.length})</h3>
              </div>
              <Link to="/lab-test" className="text-[10px] text-primary font-bold">+ Add More</Link>
            </div>
            {labItems.map((item) => (
              <div key={item.id} className="bg-card rounded-2xl border border-primary/15 p-3">
                <div className="flex gap-3">
                  <div className="w-12 h-12 bg-primary/8 rounded-xl flex items-center justify-center shrink-0">
                    <FlaskConical size={20} className="text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-[13px] font-semibold text-foreground line-clamp-1">{item.name}</h4>
                    <p className="text-[9px] text-primary/60 font-medium mt-0.5">
                      {item.item_type === "lab_package" ? "📦 Package" : "🧪 Test"}
                    </p>
                    <div className="flex items-center justify-between mt-1.5">
                      <div>
                        <span className="text-sm font-bold text-primary">৳{item.price}</span>
                        {item.original_price && item.original_price > item.price && (
                          <span className="text-[10px] text-muted-foreground line-through ml-1">৳{item.original_price}</span>
                        )}
                      </div>
                      <button onClick={() => removeItem(item.id)} className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/5 transition-colors">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </section>
        )}

        {/* Shipping Address — Simplified */}
        <div className="bg-card rounded-2xl border border-border overflow-hidden">
          <div className="p-3.5">
            <h3 className="text-xs font-bold text-foreground mb-2.5 flex items-center gap-1.5">
              <MapPin size={13} className="text-primary" /> Delivery Address
            </h3>

            {selectedAddress ? (
              <div className="flex items-start gap-3 p-3 rounded-xl bg-primary/5 border border-primary/15">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                  <MapPin size={14} className="text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-foreground">{selectedAddress.name}</span>
                    <span className="text-[9px] bg-primary/10 text-primary px-1.5 py-0.5 rounded font-medium capitalize">{selectedAddress.address_type}</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{selectedAddress.phone}</p>
                  <p className="text-[11px] text-muted-foreground line-clamp-1">
                    {selectedAddress.address}, {selectedAddress.district}
                  </p>
                  <div className="flex items-center gap-1 mt-1">
                    <Truck size={10} className="text-primary" />
                    <span className="text-[10px] font-bold text-primary">Delivery: ৳{selectedAddress.delivery_charge}</span>
                  </div>
                </div>
                <div className="flex gap-1 shrink-0">
                  <button onClick={(e) => handleEditAddress(selectedAddress, e)} className="p-1.5 rounded-lg hover:bg-primary/10 transition-colors">
                    <Pencil size={12} className="text-primary" />
                  </button>
                  <button onClick={() => setSelectedAddress(null)} className="p-1.5 rounded-lg hover:bg-destructive/10 transition-colors">
                    <X size={12} className="text-muted-foreground" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {savedAddresses?.map((addr) => (
                  <button
                    key={addr.id}
                    onClick={() => setSelectedAddress(addr)}
                    className="w-full text-left p-3 rounded-xl border border-border hover:border-primary/30 hover:bg-primary/3 transition-all flex items-center gap-2.5"
                  >
                    <MapPin size={14} className="text-muted-foreground shrink-0" />
                    <div className="flex-1 min-w-0">
                      <span className="text-xs font-medium text-foreground">{addr.name}</span>
                      <p className="text-[10px] text-muted-foreground line-clamp-1">{addr.district} — ৳{addr.delivery_charge}</p>
                    </div>
                    <ChevronRight size={14} className="text-muted-foreground shrink-0" />
                  </button>
                ))}
              </div>
            )}

            <button
              onClick={() => {
                if (!user) { navigate("/auth?redirect=/cart"); return; }
                setEditingAddress(null);
                setAddressDialogOpen(true);
              }}
              className="w-full mt-2.5 border border-dashed border-primary/30 text-xs font-semibold text-primary py-2.5 rounded-xl hover:bg-primary/5 transition-colors"
            >
              + Add New Address
            </button>
          </div>
        </div>

        {/* Coupon */}
        <button onClick={() => setCouponOpen(!couponOpen)} className="w-full bg-card rounded-2xl border border-border p-3.5 flex items-center justify-between">
          <span className="flex items-center gap-2 text-xs font-semibold text-foreground">
            <Tag size={14} className="text-primary" /> Have a Coupon?
          </span>
          <ChevronRight size={14} className={`text-muted-foreground transition-transform ${couponOpen ? 'rotate-90' : ''}`} />
        </button>
        {couponOpen && (
          <div className="flex gap-2 -mt-1">
            <input type="text" value={couponCode} onChange={(e) => setCouponCode(e.target.value)} placeholder="Enter code" className="flex-1 border border-border rounded-xl px-4 py-2.5 text-sm bg-card outline-none focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground/50" />
            <button className="bg-primary text-primary-foreground px-5 py-2.5 rounded-xl text-xs font-bold active:scale-95 transition-transform">Apply</button>
          </div>
        )}

        {/* Savings Badge */}
        {discount > 0 && (
          <div className="bg-green-50 dark:bg-green-900/15 border border-green-200 dark:border-green-800/30 rounded-2xl px-4 py-2.5 flex items-center gap-2">
            <Tag size={13} className="text-green-600 dark:text-green-400" />
            <span className="text-[11px] font-semibold text-green-700 dark:text-green-400">You're saving ৳{discount.toFixed(0)}! 🎉</span>
          </div>
        )}

        {/* Order Summary */}
        <div className="bg-card rounded-2xl border border-border p-4 space-y-2">
          <h3 className="text-xs font-bold text-foreground mb-1">Order Summary</h3>
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Subtotal (MRP)</span>
            <span className="font-medium text-foreground">৳{originalTotal.toFixed(0)}</span>
          </div>
          {discount > 0 && (
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Discount</span>
              <span className="font-medium text-green-600 dark:text-green-400">-৳{discount.toFixed(0)}</span>
            </div>
          )}
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground flex items-center gap-1"><Truck size={11} /> Delivery</span>
            <span className={`font-medium ${deliveryCharge > 0 ? "text-foreground" : "text-primary"}`}>
              {selectedAddress ? `৳${deliveryCharge}` : "Add address"}
            </span>
          </div>
          <div className="border-t border-border pt-2 flex justify-between font-bold">
            <span className="text-sm text-foreground">Total</span>
            <span className="text-base text-primary">৳{grandTotal.toFixed(0)}</span>
          </div>
        </div>

        {/* Trust Badges */}
        <div className="flex items-center justify-center gap-4 py-1">
          <span className="text-[9px] text-muted-foreground flex items-center gap-1"><ShieldCheck size={10} className="text-primary" /> Secure Payment</span>
          <span className="text-[9px] text-muted-foreground flex items-center gap-1"><Truck size={10} className="text-primary" /> Fast Delivery</span>
        </div>

        <p className="text-[9px] text-muted-foreground/60 text-center px-8">
          By proceeding, you agree to our Terms & Conditions and Privacy Policy.
        </p>
      </main>

      {/* Sticky Bottom CTA */}
      <div className="fixed bottom-14 md:bottom-0 left-0 right-0 bg-card/95 backdrop-blur-md border-t border-border z-40 safe-bottom">
        <div className="container max-w-3xl flex items-center justify-between py-3 px-4">
          <div>
            <p className="text-[10px] text-muted-foreground">{totalItems} items</p>
            <p className="text-lg font-extrabold text-foreground">৳{grandTotal.toFixed(0)}</p>
          </div>
          <button
            onClick={() => {
              if (!selectedAddress) {
                if (!user) { navigate("/auth?redirect=/cart"); return; }
                toast.error("Please add a delivery address");
                setAddressDialogOpen(true);
                return;
              }
              navigate("/checkout", { state: { addressId: selectedAddress.id } });
            }}
            className="bg-primary text-primary-foreground px-7 py-3 rounded-xl font-bold text-sm active:scale-95 transition-transform shadow-lg shadow-primary/20"
          >
            {selectedAddress ? "Checkout →" : "Add Address →"}
          </button>
        </div>
      </div>

      <ShippingAddressDialog
        open={addressDialogOpen}
        onOpenChange={(open) => { setAddressDialogOpen(open); if (!open) setEditingAddress(null); }}
        onSaved={handleAddressSaved}
        editAddress={editingAddress}
      />

      <AlertDialog open={!!deletingAddress} onOpenChange={(open) => !open && setDeletingAddress(null)}>
        <AlertDialogContent className="rounded-2xl max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-base">
              <AlertTriangle size={18} className="text-destructive" /> Delete Address?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm">
              The address for <span className="font-semibold">{deletingAddress?.name}</span> will be removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteAddress} className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-xl">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <MobileBottomNav />
    </div>
  );
};

export default CartPage;
