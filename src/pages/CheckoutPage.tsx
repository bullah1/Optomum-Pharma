import { useState, useEffect } from "react";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, CheckCircle, CreditCard, ShieldCheck, Loader2, Tag, X, Truck, FlaskConical, User, Pill } from "lucide-react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { toast } from "sonner";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { getStoredUTM, getFirstVisitId, getLastVisitId, trackMarketingEvent } from "@/hooks/useMarketingTracker";
import PageTopBar from "@/components/PageTopBar";
import MobileBottomNav from "@/components/MobileBottomNav";
import Footer from "@/components/Footer";
import type { ShippingAddress } from "@/components/ShippingAddressDialog";
import { getDivisions, getDistricts, getUpazilas, getDeliveryCharge } from "@/data/bangladeshLocations";
import { MapPin, Phone } from "lucide-react";

import payBkash from "@/assets/payment-bkash.png";
import payNagad from "@/assets/payment-nagad.png";
import payRocket from "@/assets/payment-rocket.png";
import payBank from "@/assets/payment-bank.png";
import payCard from "@/assets/payment-card.png";
import payCod from "@/assets/payment-cod.png";

const allPaymentMethods = [
  { id: "bkash", key: "payment_bkash", label: "bKash", logo: payBkash },
  { id: "nagad", key: "payment_nagad", label: "Nagad", logo: payNagad },
  { id: "rocket", key: "payment_rocket", label: "Rocket", logo: payRocket },
  { id: "bank", key: "payment_bank", label: "Bank Transfer", logo: payBank },
  { id: "card", key: "payment_card", label: "Card", logo: payCard },
  { id: "cod", key: "payment_cod", label: "Cash on Delivery", logo: payCod },
];

const CheckoutPage = () => {
  const { items, totalPrice, clearCart, totalItems } = useCart();
  const [step, setStep] = useState<"form" | "success">("form");
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { data: siteSettings } = useSiteSettings();
  const addressId = (location.state as any)?.addressId;

  const paymentMethods = allPaymentMethods.filter(
    (m) => !siteSettings || siteSettings[m.key] !== "false"
  );

  const taxPercent = Number(siteSettings?.tax_percent) || 0;
  const vatPercent = Number(siteSettings?.vat_percent) || 0;
  const [orderLoading, setOrderLoading] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState("cod");
  const [patientName, setPatientName] = useState("");
  const [patientPhone, setPatientPhone] = useState("");
  const [patientAge, setPatientAge] = useState("");
  const [patientGender, setPatientGender] = useState("male");
  const [couponCode, setCouponCode] = useState("");
  const [couponLoading, setCouponLoading] = useState(false);
  // Guest checkout (no login)
  const isGuest = !user;
  const [placedOrderId, setPlacedOrderId] = useState<string | null>(null);
  const [guest, setGuest] = useState({ name: "", phone: "", division: "", district: "", upazila: "", address: "" });
  const setG = (k: keyof typeof guest, v: string) =>
    setGuest((g) => ({ ...g, [k]: v, ...(k === "division" ? { district: "", upazila: "" } : k === "district" ? { upazila: "" } : {}) }));
  const [appliedCoupon, setAppliedCoupon] = useState<{
    id: string; code: string; discount_type: string; discount_value: number; max_discount: number | null;
  } | null>(null);

  const { data: selectedAddress } = useQuery({
    queryKey: ["shipping-address", addressId],
    queryFn: async () => {
      if (!addressId) return null;
      const { data, error } = await supabase
        .from("shipping_addresses")
        .select("*")
        .eq("id", addressId)
        .single();
      if (error) throw error;
      return data as unknown as ShippingAddress;
    },
    enabled: !!addressId,
  });

  useEffect(() => {
    if (user && !addressId && step === "form") {
      navigate("/cart");
    }
  }, [addressId, navigate, step, user]);

  const deliveryCharge = isGuest
    ? (guest.division && guest.district ? getDeliveryCharge(guest.division, guest.district) : 0)
    : selectedAddress?.delivery_charge ?? 0;

  const originalTotal = items.reduce((sum, item) => {
    const orig = item.original_price || item.price;
    return sum + orig * item.quantity;
  }, 0);
  const discount = originalTotal - totalPrice;

  let couponDiscount = 0;
  if (appliedCoupon) {
    if (appliedCoupon.discount_type === "percentage") {
      couponDiscount = (totalPrice * appliedCoupon.discount_value) / 100;
      if (appliedCoupon.max_discount && couponDiscount > appliedCoupon.max_discount) {
        couponDiscount = appliedCoupon.max_discount;
      }
    } else {
      couponDiscount = appliedCoupon.discount_value;
    }
    couponDiscount = Math.min(couponDiscount, totalPrice);
  }

  const subtotalAfterCoupon = totalPrice - couponDiscount;
  const taxAmount = (subtotalAfterCoupon * taxPercent) / 100;
  const vatAmount = (subtotalAfterCoupon * vatPercent) / 100;
  const grandTotal = subtotalAfterCoupon + taxAmount + vatAmount + deliveryCharge;

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponLoading(true);
    try {
      const { data, error } = await supabase
        .from("coupons")
        .select("*")
        .eq("code", couponCode.trim().toUpperCase())
        .eq("active", true)
        .single();
      if (error || !data) { toast.error("Invalid coupon code"); return; }
      if (data.expires_at && new Date(data.expires_at) < new Date()) { toast.error("This coupon has expired"); return; }
      if (data.usage_limit && data.used_count >= data.usage_limit) { toast.error("Coupon usage limit reached"); return; }
      if (totalPrice < Number(data.min_order_amount)) { toast.error(`Minimum order ৳${data.min_order_amount} required`); return; }
      setAppliedCoupon({
        id: data.id, code: data.code, discount_type: data.discount_type,
        discount_value: Number(data.discount_value),
        max_discount: data.max_discount ? Number(data.max_discount) : null,
      });
      toast.success(`Coupon "${data.code}" applied!`);
    } catch { toast.error("Failed to apply coupon"); } finally { setCouponLoading(false); }
  };

  const handleGuestSubmit = async () => {
    const phone = guest.phone.replace(/[^0-9]/g, "").replace(/^88/, "");
    if (guest.name.trim().length < 2) { toast.error("আপনার নাম লিখুন"); return; }
    if (!/^01[3-9][0-9]{8}$/.test(phone)) { toast.error("সঠিক মোবাইল নম্বর দিন (01XXXXXXXXX)"); return; }
    if (!guest.division || !guest.district) { toast.error("বিভাগ ও জেলা নির্বাচন করুন"); return; }
    if (guest.address.trim().length < 5) { toast.error("পূর্ণ ঠিকানা লিখুন (বাসা/রোড/এলাকা)"); return; }
    const productItems = items.filter((i) => !i.item_type || i.item_type === "product");
    if (productItems.some((i) => i.requires_prescription)) {
      toast.error("প্রেসক্রিপশন ওষুধের জন্য লগইন করুন");
      navigate("/auth?redirect=/cart");
      return;
    }
    setOrderLoading(true);
    try {
      const utm = getStoredUTM();
      const { data, error } = await supabase.rpc("place_guest_order" as any, {
        p_name: guest.name.trim(),
        p_phone: phone,
        p_division: guest.division,
        p_district: guest.district,
        p_upazila: guest.upazila || null,
        p_address: guest.address.trim(),
        p_items: productItems.map((i) => ({ id: i.id, qty: i.quantity })),
        p_payment: selectedPayment,
        p_coupon: appliedCoupon?.code || null,
        p_meta: {
          ...utm,
          device_type: window.innerWidth < 768 ? "mobile" : window.innerWidth < 1024 ? "tablet" : "desktop",
        },
      });
      if (error) throw error;
      const orderId = (data as any)?.order_id as string;
      trackMarketingEvent("order_placed", { order_id: orderId, amount: (data as any)?.total ?? grandTotal, guest: true });
      setPlacedOrderId(orderId);
      setStep("success");
      clearCart();
      toast.success("অর্ডার সফল হয়েছে!");
    } catch (error: any) {
      toast.error(error?.message || "অর্ডার করা যায়নি, আবার চেষ্টা করুন");
    } finally {
      setOrderLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { await handleGuestSubmit(); return; }
    if (!selectedAddress) { toast.error("Please select a shipping address"); navigate("/cart"); return; }

    const labItems = items.filter(i => i.item_type === "lab_test" || i.item_type === "lab_package");
    const hasLabItems = labItems.length > 0;

    if (hasLabItems && (!patientName.trim() || !patientPhone.trim())) {
      toast.error("Please fill patient info for lab tests");
      return;
    }

    setOrderLoading(true);
    try {
      const fullAddress = `${selectedAddress.address}, ${selectedAddress.upazila ? selectedAddress.upazila + ", " : ""}${selectedAddress.district}, ${selectedAddress.division}`;

      const utm = getStoredUTM();
      const firstVisitId = getFirstVisitId();
      const lastVisitId = getLastVisitId();

      // Auto-sync customer name & phone to profile from selected address
      // (so admin sees real customer info instead of "Unknown")
      try {
        // Snapshot existing profile for audit trail
        const { data: oldProfile } = await supabase
          .from("profiles")
          .select("name, phone, address")
          .eq("id", user.id)
          .maybeSingle();

        const newProfile = {
          name: selectedAddress.name,
          phone: selectedAddress.phone,
          address: fullAddress,
        };

        const { error: updateErr } = await supabase
          .from("profiles")
          .update(newProfile)
          .eq("id", user.id);

        // Only log when something actually changed (debugging/support trail)
        const changed =
          !oldProfile ||
          oldProfile.name !== newProfile.name ||
          oldProfile.phone !== newProfile.phone ||
          oldProfile.address !== newProfile.address;

        if (!updateErr && changed) {
          // Fire-and-forget audit log via secure edge function
          supabase.functions.invoke("log-checkout-sync", {
            body: {
              old_profile: oldProfile || null,
              new_profile: newProfile,
              address_id: selectedAddress.id,
              source: "checkout_auto_sync",
            },
          }).catch(() => { /* non-blocking */ });
        }
      } catch { /* non-blocking */ }

      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert({
          user_id: user.id,
          delivery_address: fullAddress,
          total_amount: grandTotal,
          delivery_charge: deliveryCharge,
          status: "pending",
          utm_source: utm.utm_source || null,
          utm_medium: utm.utm_medium || null,
          utm_campaign: utm.utm_campaign || null,
          utm_content: utm.utm_content || null,
          utm_term: utm.utm_term || null,
          device_type: window.innerWidth < 768 ? "mobile" : window.innerWidth < 1024 ? "tablet" : "desktop",
          first_visit_id: firstVisitId || null,
          last_visit_id: lastVisitId || null,
        })
        .select("id")
        .single();
      if (orderError) throw orderError;

      const productItems = items.filter(i => !i.item_type || i.item_type === "product");
      if (productItems.length > 0) {
        const orderItems = productItems.map((item) => ({
          order_id: order.id, medicine_id: item.id, quantity: item.quantity, price: item.price,
        }));
        const { error: itemsError } = await supabase.from("order_items").insert(orderItems);
        if (itemsError) throw itemsError;
      }

      // Create lab booking if there are lab items
      const labItems = items.filter(i => i.item_type === "lab_test" || i.item_type === "lab_package");
      if (labItems.length > 0 && user) {
        const fullAddr = `${selectedAddress.address}, ${selectedAddress.upazila ? selectedAddress.upazila + ", " : ""}${selectedAddress.district}, ${selectedAddress.division}`;
        const labTotal = labItems.reduce((s, i) => s + i.price * i.quantity, 0);
        await supabase.from("lab_bookings").insert({
          user_id: user.id,
          patient_name: patientName,
          patient_phone: patientPhone,
          patient_age: patientAge ? Number(patientAge) : null,
          patient_gender: patientGender,
          address: fullAddr,
          preferred_date: new Date().toISOString().split("T")[0],
          total_amount: labTotal,
          payment_method: selectedPayment,
          items: labItems.map(i => ({ id: i.id, name: i.name, price: i.price, type: i.item_type })) as any,
        });
      }

      await supabase.from("payments").insert({
        order_id: order.id, user_id: user.id, amount: grandTotal, method: selectedPayment, status: "pending",
      });

      if (appliedCoupon) {
        await supabase.rpc("increment_coupon_usage" as any, { coupon_id: appliedCoupon.id });
      }

      trackMarketingEvent("order_placed", { order_id: order.id, amount: grandTotal });
      setPlacedOrderId(order.id);
      setStep("success");
      clearCart();
      toast.success("Order placed successfully!");
    } catch (error: any) {
      toast.error(error.message || "Failed to place order");
    } finally {
      setOrderLoading(false);
    }
  };

  if (items.length === 0 && step !== "success") {
    return (
      <div className="min-h-screen bg-background pb-16 md:pb-0">
        <PageTopBar title="Checkout" />
        <main className="container py-16 flex flex-col items-center gap-4">
          <span className="text-4xl">🛒</span>
          <p className="text-muted-foreground text-sm">No items in checkout</p>
          <Link to="/" className="bg-primary text-primary-foreground px-6 py-2.5 rounded-lg font-semibold text-sm">Go Back Home</Link>
        </main>
        <MobileBottomNav />
      </div>
    );
  }

  if (step === "success") {
    return (
      <div className="min-h-screen bg-background pb-16 md:pb-0">
        <PageTopBar title="Order Confirmed" showCart={false} />
        <main className="container py-16 flex flex-col items-center gap-5 text-center max-w-md mx-auto">
          <CheckCircle size={48} className="text-green-500" />
          <h2 className="text-xl font-bold text-foreground">অর্ডার সফল হয়েছে!</h2>
          {placedOrderId && (
            <p className="text-sm text-foreground">
              অর্ডার নম্বর: <span className="font-bold text-primary">#{placedOrderId.slice(0, 8).toUpperCase()}</span>
            </p>
          )}
          <p className="text-sm text-muted-foreground">
            আমাদের প্রতিনিধি শীঘ্রই আপনাকে ফোন করে অর্ডার কনফার্ম করবেন। যেকোনো প্রয়োজনে কল করুন।
          </p>
          <a href="tel:01306383938" className="flex items-center gap-2 border border-primary/30 text-primary px-6 py-2.5 rounded-lg font-semibold text-sm">
            <Phone size={15} /> 01306383938
          </a>
          <Link to="/" className="bg-primary text-primary-foreground px-6 py-2.5 rounded-lg font-semibold text-sm">আরও কেনাকাটা করুন</Link>
        </main>
        <MobileBottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <PageTopBar title="Checkout" subtitle={`${totalItems} items`} />
      <main className="container py-4 max-w-2xl space-y-4">

        <form onSubmit={handleSubmit} className="space-y-3">
          {isGuest && (
            <div className="bg-card rounded-xl border border-primary/30 overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-primary/5">
                <MapPin size={15} className="text-primary" />
                <h3 className="text-sm font-bold text-foreground">ডেলিভারি তথ্য</h3>
                <Link to="/auth?redirect=/cart" className="ml-auto text-[11px] font-semibold text-primary underline">লগইন</Link>
              </div>
              <div className="p-4 space-y-3">
                <input type="text" autoComplete="name" placeholder="আপনার নাম *" value={guest.name} onChange={(e) => setG("name", e.target.value)} maxLength={80}
                  className="w-full px-3 py-2.5 rounded-lg border border-border bg-transparent text-sm outline-none focus:ring-1 focus:ring-primary/40" required />
                <input type="tel" inputMode="numeric" autoComplete="tel" placeholder="মোবাইল নম্বর * (01XXXXXXXXX)" value={guest.phone} onChange={(e) => setG("phone", e.target.value)} maxLength={14}
                  className="w-full px-3 py-2.5 rounded-lg border border-border bg-transparent text-sm outline-none focus:ring-1 focus:ring-primary/40" required />
                <div className="grid grid-cols-2 gap-3">
                  <select value={guest.division} onChange={(e) => setG("division", e.target.value)} required
                    className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-sm outline-none focus:ring-1 focus:ring-primary/40">
                    <option value="">বিভাগ *</option>
                    {getDivisions().map((d) => <option key={d} value={d}>{d}</option>)}
                  </select>
                  <select value={guest.district} onChange={(e) => setG("district", e.target.value)} required disabled={!guest.division}
                    className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-sm outline-none focus:ring-1 focus:ring-primary/40 disabled:opacity-50">
                    <option value="">জেলা *</option>
                    {getDistricts(guest.division).map((d) => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                {guest.district && getUpazilas(guest.division, guest.district).length > 0 && (
                  <select value={guest.upazila} onChange={(e) => setG("upazila", e.target.value)}
                    className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-sm outline-none focus:ring-1 focus:ring-primary/40">
                    <option value="">উপজেলা / থানা</option>
                    {getUpazilas(guest.division, guest.district).map((u) => <option key={u} value={u}>{u}</option>)}
                  </select>
                )}
                <textarea placeholder="পূর্ণ ঠিকানা * (বাসা, রোড, এলাকা)" value={guest.address} onChange={(e) => setG("address", e.target.value)} rows={2} maxLength={300}
                  className="w-full px-3 py-2.5 rounded-lg border border-border bg-transparent text-sm outline-none focus:ring-1 focus:ring-primary/40 resize-none" required />
                <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                  <Truck size={12} className="text-primary" /> ডেলিভারি চার্জ: ঢাকা সিটি ৳৭০ · ঢাকার বাইরে ৳১৩০
                </p>
              </div>
            </div>
          )}

          {/* Order Summary */}
          <div className="bg-card rounded-xl border border-border overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
              <Truck size={15} className="text-primary" />
              <h3 className="text-sm font-bold text-foreground">Order Summary</h3>
            </div>

            {selectedAddress && (
              <div className="px-4 py-3 border-b border-border bg-primary/3">
                <p className="text-xs font-semibold text-foreground">{selectedAddress.name} · {selectedAddress.phone}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {selectedAddress.address}, {selectedAddress.upazila && `${selectedAddress.upazila}, `}
                  {selectedAddress.district}, {selectedAddress.division}
                </p>
              </div>
            )}

            {/* Medicine Items */}
            {items.filter(i => !i.item_type || i.item_type === "product").length > 0 && (
              <div className="px-4 py-3 border-b border-border">
                <div className="flex items-center gap-1.5 mb-2">
                  <Pill size={14} className="text-primary" />
                  <p className="text-[11px] font-bold text-foreground">Medicine ({items.filter(i => !i.item_type || i.item_type === "product").length})</p>
                </div>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {items.filter(i => !i.item_type || i.item_type === "product").map((item) => (
                    <div key={item.id} className="flex gap-2.5">
                      <div className="w-9 h-9 bg-secondary/50 rounded-lg flex items-center justify-center shrink-0 overflow-hidden">
                        {item.image_url ? <img src={item.image_url} alt={item.name} className="w-full h-full object-contain p-0.5" /> : <Pill size={16} className="text-muted-foreground/30" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-medium text-foreground line-clamp-1">{item.name}</p>
                        <p className="text-[10px] text-muted-foreground">x{item.quantity}</p>
                      </div>
                      <span className="text-[12px] font-semibold text-foreground shrink-0">৳{(item.price * item.quantity).toFixed(0)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Lab Test Items */}
            {items.filter(i => i.item_type === "lab_test" || i.item_type === "lab_package").length > 0 && (
              <div className="px-4 py-3 border-b border-border">
                <div className="flex items-center gap-1.5 mb-2">
                  <FlaskConical size={14} className="text-primary" />
                  <p className="text-[11px] font-bold text-foreground">Lab Tests ({items.filter(i => i.item_type === "lab_test" || i.item_type === "lab_package").length})</p>
                </div>
                <div className="space-y-2">
                  {items.filter(i => i.item_type === "lab_test" || i.item_type === "lab_package").map((item) => (
                    <div key={item.id} className="flex gap-2.5">
                      <div className="w-9 h-9 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
                        <FlaskConical size={16} className="text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-medium text-foreground line-clamp-1">{item.name}</p>
                        <p className="text-[10px] text-primary/70">{item.item_type === "lab_package" ? "📦 Package" : "🧪 Test"}</p>
                      </div>
                      <span className="text-[12px] font-semibold text-foreground shrink-0">৳{(item.price * item.quantity).toFixed(0)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Price breakdown */}
            <div className="px-4 py-3 space-y-2 text-[13px]">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal (MRP)</span>
                <span className="font-medium text-foreground">৳{originalTotal.toFixed(0)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Discount</span>
                  <span className="font-medium text-green-600 dark:text-green-400">-৳{discount.toFixed(0)}</span>
                </div>
              )}
              {couponDiscount > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Coupon ({appliedCoupon?.code})</span>
                  <span className="font-medium text-primary">-৳{couponDiscount.toFixed(0)}</span>
                </div>
              )}
              {taxPercent > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tax ({taxPercent}%)</span>
                  <span className="font-medium text-foreground">৳{taxAmount.toFixed(0)}</span>
                </div>
              )}
              {vatPercent > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">VAT ({vatPercent}%)</span>
                  <span className="font-medium text-foreground">৳{vatAmount.toFixed(0)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Delivery</span>
                <span className="font-medium text-foreground text-[11px]">{isGuest && !guest.district ? "জেলা নির্বাচন করুন" : `৳${deliveryCharge}`}</span>
              </div>
              <div className="border-t border-border pt-3 flex justify-between font-bold text-sm">
                <span className="text-foreground">Total</span>
                <span className="text-primary">৳{grandTotal.toFixed(0)}</span>
              </div>
            </div>
          </div>

          {/* Patient Info for Lab Tests */}
          {items.some(i => i.item_type === "lab_test" || i.item_type === "lab_package") && (
            <div className="bg-card rounded-xl border border-border overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
                <User size={15} className="text-primary" />
                <h3 className="text-sm font-bold text-foreground">Patient Info (Lab Tests)</h3>
              </div>
              <div className="p-4 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <input
                      type="text"
                      placeholder="Patient Name *"
                      value={patientName}
                      onChange={(e) => setPatientName(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-lg border border-border bg-transparent text-sm outline-none focus:ring-1 focus:ring-primary/40 placeholder:text-muted-foreground/60"
                      required
                    />
                  </div>
                  <input
                    type="tel"
                    placeholder="Phone Number *"
                    value={patientPhone}
                    onChange={(e) => setPatientPhone(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-lg border border-border bg-transparent text-sm outline-none focus:ring-1 focus:ring-primary/40 placeholder:text-muted-foreground/60"
                    required
                  />
                  <input
                    type="number"
                    placeholder="Age"
                    value={patientAge}
                    onChange={(e) => setPatientAge(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-lg border border-border bg-transparent text-sm outline-none focus:ring-1 focus:ring-primary/40 placeholder:text-muted-foreground/60"
                  />
                </div>
                <div className="flex gap-2">
                  {["male", "female", "other"].map((g) => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => setPatientGender(g)}
                      className={`flex-1 py-2 rounded-lg text-xs font-semibold border transition-colors ${
                        patientGender === g ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/30"
                      }`}
                    >
                      {g === "male" ? "Male" : g === "female" ? "Female" : "Other"}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Coupon Code */}
          <div className="bg-card rounded-xl border border-border overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
              <Tag size={15} className="text-primary" />
              <h3 className="text-sm font-bold text-foreground">Coupon Code</h3>
            </div>
            <div className="p-4">
              {appliedCoupon ? (
                <div className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-primary/5 border border-primary/20">
                  <div>
                    <span className="text-sm font-bold text-primary">{appliedCoupon.code}</span>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      {appliedCoupon.discount_type === "percentage" ? `${appliedCoupon.discount_value}% off` : `৳${appliedCoupon.discount_value} off`}
                      {appliedCoupon.max_discount ? ` (max ৳${appliedCoupon.max_discount})` : ""}
                    </p>
                  </div>
                  <button type="button" onClick={() => { setAppliedCoupon(null); setCouponCode(""); }} className="p-1.5 text-destructive hover:bg-destructive/10 rounded transition-colors">
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input type="text" value={couponCode} onChange={(e) => setCouponCode(e.target.value.toUpperCase())} placeholder="Enter coupon code" className="flex-1 px-4 py-2.5 rounded-lg border border-border bg-transparent text-sm outline-none focus:ring-1 focus:ring-primary/40 uppercase placeholder:normal-case" />
                  <button type="button" onClick={handleApplyCoupon} disabled={couponLoading || !couponCode.trim()} className="px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-50 flex items-center gap-1.5">
                    {couponLoading && <Loader2 className="animate-spin" size={14} />}
                    Apply
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Payment Method */}
          <div className="bg-card rounded-xl border border-border overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
              <CreditCard size={15} className="text-primary" />
              <h3 className="text-sm font-bold text-foreground">Payment Method</h3>
            </div>
            <div className="p-4 grid grid-cols-2 gap-2">
              {paymentMethods.map((method) => (
                <button
                  key={method.id}
                  type="button"
                  onClick={() => setSelectedPayment(method.id)}
                  className={`flex items-center gap-2.5 p-3 rounded-lg border transition-colors text-left ${
                    selectedPayment === method.id ? "border-primary bg-primary/5" : "border-border hover:border-primary/30"
                  }`}
                >
                  <img src={method.logo} alt={method.label} className="w-7 h-7 object-contain rounded" loading="lazy" width={28} height={28} />
                  <span className="text-[13px] font-medium text-foreground">{method.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Place Order */}
          <div className="pt-1">
            <button
              type="submit"
              disabled={orderLoading}
              className="w-full bg-primary text-primary-foreground py-3.5 rounded-lg font-semibold text-sm active:scale-[0.98] transition-transform disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {orderLoading && <Loader2 className="animate-spin" size={16} />}
              {orderLoading ? "Placing Order..." : `Place Order · ৳${grandTotal.toFixed(0)}`}
            </button>
            <div className="flex items-center justify-center gap-1.5 mt-3">
              <ShieldCheck size={12} className="text-muted-foreground" />
              <span className="text-[10px] text-muted-foreground">Your information is completely safe</span>
            </div>
          </div>
        </form>
      </main>
      <Footer />
      <MobileBottomNav />
    </div>
  );
};

export default CheckoutPage;
