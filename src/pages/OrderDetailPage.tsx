import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import PageTopBar from "@/components/PageTopBar";
import MobileBottomNav from "@/components/MobileBottomNav";
import { ArrowLeft, Loader2, Package, MapPin, Phone, User, Tag, CheckCircle2, XCircle, Clock, Truck, CreditCard, PackageCheck, PackageOpen, CircleDot, Download, History } from "lucide-react";
import { format } from "date-fns";
import { useCart } from "@/contexts/CartContext";
import { toast } from "sonner";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { resolveDisplayOrderStatus } from "@/lib/orderStatus";

interface SiteSettings {
  site_name: string | null;
  contact_phone: string | null;
  contact_email: string | null;
  contact_address: string | null;
}

interface DatabaseResponse<T> {
  data: T[] | null;
  error: any;
}

interface OrderItem {
  id: string;
  quantity: number;
  price: number;
  medicine_id: string;
  medicines: { name: string; name_bn: string | null; image_url: string | null; company: string | null; original_price: number | null; price: number } | null;
}

interface Order {
  id: string;
  status: string;
  tracking_status: string | null;
  total_amount: number;
  delivery_charge: number;
  delivery_address: string;
  created_at: string;
  updated_at: string;
  order_items: OrderItem[];
}

const trackingSteps = [
  { key: "pending", label: "Order Placed", labelBn: "Order Placed", desc: "Your order has been placed successfully.", icon: CircleDot },
  { key: "processing", label: "Processing", labelBn: "Processing", desc: "We have received your order, our pharmacist will check and confirm shortly.", icon: Clock },
  { key: "payment", label: "Payment", labelBn: "Payment", desc: "", icon: CreditCard },
  { key: "confirmed", label: "Confirmed", labelBn: "Confirmed", desc: "We have confirmed your order.", icon: CheckCircle2 },
  { key: "packing", label: "Packing", labelBn: "Packing", desc: "Your order is being packed.", icon: PackageOpen },
  { key: "packed", label: "Packed", labelBn: "Packed", desc: "Your order has been packed.", icon: PackageCheck },
  { key: "shipped", label: "Delivering", labelBn: "Delivering", desc: "Your order is on the way.", icon: Truck },
  { key: "delivered", label: "Delivered", labelBn: "Delivered", desc: "Your order has been delivered.", icon: CheckCircle2 },
];

const cancelledStep = { key: "cancelled", label: "Cancelled", labelBn: "Cancelled", desc: "Your order has been cancelled.", icon: XCircle };

const statusOrder = ["pending", "processing", "payment", "confirmed", "packing", "packed", "shipped", "delivered"];

const OrderDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { addItem } = useCart();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusLogs, setStatusLogs] = useState<Record<string, string>>({});
  const { data: settings } = useSiteSettings();

  useEffect(() => {
    if (authLoading) return;
    if (!user) { navigate("/auth"); return; }

    const fetchOrder = async () => {
      const [orderRes, logsRes] = await Promise.all([
        supabase
          .from("orders")
          .select("*, order_items(*, medicines(name, name_bn, image_url, company, original_price, price))")
          .eq("id", id!)
          .eq("user_id", user.id)
          .single(),
        supabase
          .from("order_status_logs")
          .select("new_status, created_at")
          .eq("order_id", id!)
          .order("created_at", { ascending: true }),
      ]);

      if (orderRes.data) setOrder(orderRes.data as unknown as Order);
      if (orderRes.error) { console.error(orderRes.error); toast.error("Order not found"); navigate("/orders"); }

      // Build a map of status -> earliest timestamp
      if (logsRes.data) {
        const map: Record<string, string> = {};
        logsRes.data.forEach((log: any) => {
          if (!map[log.new_status]) map[log.new_status] = log.created_at;
        });
        setStatusLogs(map);
      }

      setLoading(false);
    };

    fetchOrder();

    const channel = supabase
      .channel(`order-${id}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "orders", filter: `id=eq.${id}` },
        async (payload) => {
          const updated = payload.new as any;
          setOrder((prev) => prev ? { ...prev, status: updated.status, tracking_status: updated.tracking_status, updated_at: updated.updated_at } : prev);
          // Refetch status logs for updated timestamps
          const { data: logs } = await supabase
            .from("order_status_logs")
            .select("new_status, created_at")
            .eq("order_id", id!)
            .order("created_at", { ascending: true });
          if (logs) {
            const map: Record<string, string> = {};
            logs.forEach((log: any) => { if (!map[log.new_status]) map[log.new_status] = log.created_at; });
            setStatusLogs(map);
          }
          toast.info("Order status updated!");
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [id, user, authLoading, navigate]);

  const handleCancelOrder = async () => {
    if (!order || !confirm("Are you sure you want to cancel this order?")) return;
    const { error } = await supabase.from("orders").update({ status: "cancelled", tracking_status: "cancelled" }).eq("id", order.id);
    if (error) { toast.error("Failed to cancel"); return; }
    toast.success("Order cancelled");
    setOrder({ ...order, status: "cancelled", tracking_status: "cancelled" });
  };

  const handleReorder = () => {
    if (!order) return;
    order.order_items.forEach((item) => {
      if (item.medicines) {
        addItem({
          id: item.medicine_id,
          name: item.medicines.name,
          name_bn: item.medicines.name_bn,
          price: item.medicines.price,
          original_price: item.medicines.original_price,
          image_url: item.medicines.image_url,
          company: item.medicines.company,
          requires_prescription: false,
        });
      }
    });
    toast.success("Items added to cart");
    navigate("/cart");
  };

  const handleDownloadInvoice = async () => {
    if (!order) return;

    const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([
      import("jspdf"),
      import("jspdf-autotable"),
    ]);

    const doc = new jsPDF();
    const orderId = order.id.slice(0, 8).toUpperCase();
    const orderDate = format(new Date(order.created_at), "dd MMM yyyy");
    const pageW = doc.internal.pageSize.getWidth();
    const margin = 14;

    const companyName = settings?.site_name || "Optimum Pharmaceuticals HLB";
    const companyPhone = settings?.contact_phone || "+8801306383938";
    const companyEmail = settings?.contact_email || "";
    const companyAddress = settings?.contact_address || "Dhaka, Bangladesh";

    // Add logo
    try {
      const logoImg = new Image();
      logoImg.crossOrigin = "anonymous";
      await new Promise<void>((resolve) => {
        logoImg.onload = () => {
          doc.addImage(logoImg, "JPEG", margin, 12, 18, 18);
          resolve();
        };
        logoImg.onerror = () => resolve();
        logoImg.src = settings?.site_logo || "/images/optimum-logo.jpg";
      });
    } catch {}

    // Company name with brand colors
    doc.setFontSize(24);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(248, 147, 29); // brand orange #F8931D
    doc.text("Optimum", margin + 22, 22);
    const mediW = doc.getTextWidth("Optimum ");
    doc.setTextColor(1, 174, 242); // brand blue #01AEF2
    doc.text("HLB", margin + 22 + mediW, 22);

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 116, 139);
    doc.text(`${companyPhone}${companyEmail ? ` • ${companyEmail}` : ""}`, margin + 22, 28);
    doc.text(companyAddress, margin + 22, 33);

    // Invoice badge (right side)
    doc.setFillColor(248, 147, 29);
    doc.roundedRect(pageW - margin - 42, 12, 42, 10, 2, 2, "F");
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(255);
    doc.text("INVOICE", pageW - margin - 21, 19, { align: "center" });

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(71, 85, 105);
    doc.text(`# ${orderId}`, pageW - margin, 28, { align: "right" });
    doc.text(`Date: ${orderDate}`, pageW - margin, 33, { align: "right" });

    // Gradient divider
    doc.setDrawColor(248, 147, 29);
    doc.setLineWidth(1.2);
    doc.line(margin, 38, pageW - margin, 38);

    // Customer details section
    const secY = 44;
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(248, 147, 29);
    doc.text("CUSTOMER DETAILS", margin, secY);

    doc.setFontSize(9);
    doc.setTextColor(30, 41, 59);
    const custY = secY + 7;
    doc.setFont("helvetica", "bold");
    doc.text("Name:", margin, custY);
    doc.setFont("helvetica", "normal");
    doc.text(user?.user_metadata?.name || user?.email?.split("@")[0] || "—", margin + 18, custY);

    doc.setFont("helvetica", "bold");
    doc.text("Phone:", pageW / 2, custY);
    doc.setFont("helvetica", "normal");
    doc.text(user?.phone || "—", pageW / 2 + 18, custY);

    doc.setFont("helvetica", "bold");
    doc.text("Email:", margin, custY + 6);
    doc.setFont("helvetica", "normal");
    doc.text(user?.email || "—", margin + 18, custY + 6);

    doc.setFont("helvetica", "bold");
    doc.text("Address:", margin, custY + 12);
    doc.setFont("helvetica", "normal");
    const addrLines = doc.splitTextToSize(order.delivery_address, pageW - margin * 2 - 22);
    doc.text(addrLines, margin + 22, custY + 12);

    // Order items
    const fmt = (n: number) => Math.round(Number(n) || 0).toLocaleString("en-US");
    const subtotal = order.order_items.reduce((s, i) => s + i.price * i.quantity, 0);
    const originalTotal = order.order_items.reduce((s, i) => {
      const orig = i.medicines?.original_price || i.price;
      return s + orig * i.quantity;
    }, 0);
    const discount = originalTotal - subtotal;

    const tableData = order.order_items.map((item, i) => {
      const mrp = item.medicines?.original_price || item.price;
      const disc = (mrp - item.price) * item.quantity;
      return [
        i + 1,
        item.medicines?.name || "Medicine",
        `${item.quantity}`,
        `৳${fmt(mrp)}`,
        disc > 0 ? `-৳${fmt(disc)}` : "—",
        `৳${fmt(item.price * item.quantity)}`,
      ];
    });

    const tableStartY = custY + 12 + (addrLines.length > 1 ? addrLines.length * 4 : 0) + 8;

    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(248, 147, 29);
    doc.text("ORDER ITEMS", margin, tableStartY);

    autoTable(doc, {
      startY: tableStartY + 4,
      head: [["#", "Product", "Qty", "MRP", "Discount", "Amount"]],
      body: tableData,
      styles: { fontSize: 8.5, cellPadding: 4, textColor: [51, 65, 85] },
      headStyles: { fillColor: [248, 250, 252], textColor: [51, 65, 85], fontStyle: "bold", lineWidth: 0, lineColor: [226, 232, 240] },
      bodyStyles: { lineWidth: 0.3, lineColor: [241, 245, 249] },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      columnStyles: {
        0: { cellWidth: 14, halign: "center" },
        1: { cellWidth: 62 },
        2: { cellWidth: 18, halign: "center" },
        3: { cellWidth: 24, halign: "right" },
        4: { cellWidth: 24, halign: "right" },
        5: { cellWidth: 28, halign: "right", fontStyle: "bold" },
      },
      theme: "grid",
      tableLineColor: [226, 232, 240],
      tableLineWidth: 0.5,
    });

    const finalY = (doc as any).lastAutoTable?.finalY || 150;

    const summaryX = pageW - margin - 80;
    const summaryW = 80;
    let sumY = finalY + 8;

    const summaryRows: { label: string; value: string; bold?: boolean; color?: number[]; bg?: number[] }[] = [
      { label: "Subtotal (MRP)", value: `৳${fmt(originalTotal)}` },
    ];
    if (discount > 0) {
      summaryRows.push({ label: "Discount", value: `-৳${fmt(discount)}`, color: [220, 38, 38] });
    }
    summaryRows.push({ label: "Delivery", value: order.delivery_charge === 0 ? "Free" : `৳${fmt(order.delivery_charge)}` });
    summaryRows.push({ label: "Total Payable", value: `৳${fmt(order.total_amount)}`, bold: true, bg: [248, 147, 29] });

    summaryRows.forEach((row) => {
      if (row.bg) {
        doc.setFillColor(row.bg[0], row.bg[1], row.bg[2]);
        doc.roundedRect(summaryX - 4, sumY - 4, summaryW + 8, 10, 2, 2, "F");
        doc.setTextColor(255);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
      } else {
        doc.setTextColor(row.color?.[0] ?? 71, row.color?.[1] ?? 85, row.color?.[2] ?? 105);
        doc.setFont("helvetica", row.bold ? "bold" : "normal");
        doc.setFontSize(9);
      }
      doc.text(row.label, summaryX, sumY);
      doc.text(row.value, summaryX + summaryW, sumY, { align: "right" });
      sumY += row.bg ? 14 : 8;
    });

    // Terms & Conditions
    const termsY = sumY + 6;
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(margin, termsY, pageW - margin * 2, 28, 3, 3, "F");
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(margin, termsY, pageW - margin * 2, 28, 3, 3, "S");

    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(71, 85, 105);
    doc.text("Terms & Conditions", margin + 6, termsY + 6);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 116, 139);
    doc.setFontSize(7);
    doc.text("• All prices are inclusive of applicable taxes.", margin + 6, termsY + 12);
    doc.text("• Products once delivered cannot be returned unless damaged or incorrect.", margin + 6, termsY + 17);
    doc.text("• This is a computer-generated invoice and does not require a signature.", margin + 6, termsY + 22);

    // QR Code section
    const qrY = termsY + 34;
    const installUrl = `${window.location.origin}/install`;
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(installUrl)}&color=059669&ecc=H`;

    doc.setFillColor(230, 247, 254);
    doc.roundedRect(margin, qrY, pageW - margin * 2, 38, 4, 4, "F");
    doc.setDrawColor(127, 214, 248);
    doc.setLineWidth(0.7);
    doc.roundedRect(margin, qrY, pageW - margin * 2, 38, 4, 4, "S");

    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 146, 204);
    doc.text("📲 Download Optimum Pharmaceuticals HLB App", margin + 42, qrY + 12);
    doc.setFontSize(8.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(30, 41, 59);
    doc.text("Scan this QR code to install the app instantly — no app store needed!", margin + 42, qrY + 20);
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text("Fast ordering  •  Live tracking  •  Exclusive offers", margin + 42, qrY + 27);

    try {
      const qrImg = new Image();
      qrImg.crossOrigin = "anonymous";
      await new Promise<void>((resolve) => {
        qrImg.onload = () => {
          doc.addImage(qrImg, "PNG", margin + 4, qrY + 3, 30, 30);
          resolve();
        };
        qrImg.onerror = () => resolve();
        qrImg.src = qrUrl;
      });
    } catch {}

    // Footer
    doc.setFontSize(7.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(148, 163, 184);
    doc.text(`Thank you for choosing ${companyName}! Your health is our priority.`, pageW / 2, 284, { align: "center" });
    doc.text(`${companyPhone} • ${companyAddress}`, pageW / 2, 289, { align: "center" });

    doc.save(`Optimum Pharmaceuticals HLB-Invoice-${orderId}.pdf`);
    toast.success("Invoice downloaded!");
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="animate-spin text-primary" size={28} />
      </div>
    );
  }

  if (!order) return null;

  const currentStatus = resolveDisplayOrderStatus(order.status, order.tracking_status);
  const isCancelled = currentStatus === "cancelled";
  const currentIdx = statusOrder.indexOf(currentStatus);
  const subtotal = order.order_items.reduce((s, i) => s + i.price * i.quantity, 0);
  const originalTotal = order.order_items.reduce((s, i) => {
    const orig = i.medicines?.original_price || i.price;
    return s + orig * i.quantity;
  }, 0);
  const discount = originalTotal - subtotal;

  const stepsToShow = isCancelled
    ? [...trackingSteps.slice(0, Math.max(currentIdx, statusOrder.indexOf(order.status || "pending")) + 1), cancelledStep]
    : trackingSteps;

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <PageTopBar title="Order Details" />

      <div className="max-w-lg mx-auto px-4 py-4 space-y-4">

        {/* Tracking Timeline */}
        <div className="bg-card rounded-xl border border-border p-5 overflow-hidden">
          <div className="relative">
            {stepsToShow.map((step, i) => {
              const stepIdx = statusOrder.indexOf(step.key);
              const isReached = isCancelled
                ? (step.key === "cancelled" || stepIdx <= currentIdx)
                : stepIdx <= currentIdx;
              const isCurrent = step.key === currentStatus || (isCancelled && step.key === "cancelled");
              const isLast = i === stepsToShow.length - 1;
              const StepIcon = step.icon;

              let timestamp = "";
              if (step.key === "pending" && isReached) {
                timestamp = format(new Date(order.created_at), "MMM dd, hh:mm a");
              } else if (isReached && statusLogs[step.key]) {
                timestamp = format(new Date(statusLogs[step.key]), "MMM dd, hh:mm a");
              } else if (isReached) {
                // For intermediate steps without their own log, find the closest prior logged status
                const priorStatuses = statusOrder.slice(0, stepIdx + 1).reverse();
                for (const ps of priorStatuses) {
                  if (statusLogs[ps]) {
                    timestamp = format(new Date(statusLogs[ps]), "MMM dd, hh:mm a");
                    break;
                  }
                }
                // Fallback to updated_at for current status
                if (!timestamp && isCurrent) {
                  timestamp = format(new Date(order.updated_at), "MMM dd, hh:mm a");
                }
              }

              const delay = `${i * 80}ms`;

              return (
                <div
                  key={step.key}
                  className="flex gap-3.5 animate-fade-in"
                  style={{ animationDelay: delay, animationFillMode: "both" }}
                >
                  <div className="w-[68px] shrink-0 text-right pt-1">
                    {timestamp ? (
                      <p className="text-[10px] font-medium text-foreground/70 leading-tight">{timestamp}</p>
                    ) : (
                      <p className="text-[10px] text-muted-foreground/30 font-mono">--:--</p>
                    )}
                  </div>

                  <div className="flex flex-col items-center relative">
                    {isCurrent && !isCancelled && (
                      <div className="absolute w-9 h-9 rounded-full bg-primary/10 animate-[pulse_2s_ease-in-out_infinite] -translate-x-0 -translate-y-0 top-0" />
                    )}
                    <div
                      className={`relative z-10 w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-all duration-500 ${
                        isReached
                          ? step.key === "cancelled"
                            ? "bg-destructive text-destructive-foreground"
                            : step.key === "delivered"
                              ? "bg-emerald-500 text-white"
                              : isCurrent
                                ? "bg-primary text-primary-foreground"
                                : "bg-primary/80 text-primary-foreground"
                          : "bg-muted text-muted-foreground/30 border border-border"
                      }`}
                    >
                      <StepIcon size={13} strokeWidth={isReached ? 2.5 : 1.5} />
                    </div>
                    {!isLast && (
                      <div className="relative w-0.5 h-9 my-0.5">
                        <div className="absolute inset-0 bg-border/50 rounded-full" />
                        <div
                          className={`absolute top-0 left-0 w-full rounded-full transition-all duration-700 ease-out ${
                            isReached
                              ? step.key === "cancelled"
                                ? "bg-destructive/50 h-full"
                                : "bg-primary/60 h-full"
                              : "bg-transparent h-0"
                          }`}
                          style={{ transitionDelay: delay }}
                        />
                      </div>
                    )}
                  </div>

                  <div className="pt-1 pb-2.5 min-w-0 flex-1">
                    <p className={`text-[13px] font-bold transition-colors duration-300 ${
                      isReached
                        ? step.key === "cancelled"
                          ? "text-destructive"
                          : isCurrent
                            ? "text-primary"
                            : "text-foreground"
                        : "text-muted-foreground/40"
                    }`}>
                      {step.label}
                    </p>
                    {step.desc && isReached && (
                      <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed animate-fade-in"
                         style={{ animationDelay: `${i * 80 + 150}ms`, animationFillMode: "both" }}>
                        {step.desc}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Contact info */}
          <div className="border-t border-border mt-4 pt-4 text-center animate-fade-in" style={{ animationDelay: "600ms", animationFillMode: "both" }}>
            <p className="text-[11px] text-muted-foreground">If You Have Any Query,</p>
            <p className="text-xs font-semibold text-foreground mt-1">
              Call Us On <a href="tel:+8801306383938" className="text-primary font-bold">+8801306383938</a> or{" "}
              <a href="https://m.me/optimumpharmahlb" target="_blank" rel="noopener" className="text-primary underline font-bold">Message Us On Facebook</a>
            </p>
          </div>
        </div>

        {/* Order Items */}
        <div className="bg-card rounded-xl border border-border overflow-hidden divide-y divide-border/30">
          {order.order_items.map((item) => {
            const orig = item.medicines?.original_price;
            return (
              <div key={item.id} className="flex items-center gap-3 p-4">
                <div className="w-14 h-14 rounded-xl bg-secondary/50 flex items-center justify-center shrink-0 overflow-hidden">
                  {item.medicines?.image_url ? (
                    <img src={item.medicines.image_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <Package size={20} className="text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {item.medicines?.name || "Medicine"}
                  </p>
                  <p className="text-[11px] text-muted-foreground">{item.medicines?.company || ""}</p>
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-[11px] text-muted-foreground">{item.quantity}x</p>
                    <div className="flex items-center gap-1.5">
                      {orig && orig > item.price && (
                        <span className="text-[11px] text-muted-foreground line-through">৳{orig}</span>
                      )}
                      <span className="text-sm font-bold text-foreground">৳{item.price}</span>
                    </div>
                  </div>
                  <p className="text-[10px] text-muted-foreground">Quantity: {item.quantity}</p>
                </div>
              </div>
            );
          })}

          {/* Reorder button */}
          <div className="p-4">
            <button
              onClick={handleReorder}
              className="w-full py-2.5 text-sm font-semibold text-primary border-2 border-primary rounded-xl hover:bg-primary/5 transition-colors"
            >
              Create another order with these items
            </button>
          </div>
        </div>

        {/* Shipping Address */}
        <div className="bg-card rounded-xl border border-border p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-foreground">Address Shipping</h3>
            {!isCancelled && currentStatus !== "delivered" && currentStatus !== "shipped" && (
              <button
                onClick={handleCancelOrder}
                className="px-3 py-1.5 text-[11px] font-semibold text-destructive bg-destructive/10 rounded-xl hover:bg-destructive/20 transition-colors"
              >
                Cancel Order
              </button>
            )}
          </div>
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center shrink-0">
              <MapPin size={18} className="text-muted-foreground" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-foreground leading-relaxed">{order.delivery_address}</p>
            </div>
          </div>
        </div>

        {/* Status Activity Log */}
        <StatusActivityLog orderId={order.id} />

        {/* Savings Banner */}
        {discount > 0 && (
          <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl px-4 py-3 flex items-center gap-2">
            <Tag size={16} className="text-emerald-600 dark:text-emerald-400" />
            <p className="text-sm text-emerald-700 dark:text-emerald-300 font-medium">
              You are saving ৳{discount} in this order.
            </p>
          </div>
        )}

        {/* Order Summary */}
        <div className="bg-card rounded-xl border border-border p-4 space-y-2.5">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Order ID</span>
            <span className="font-mono font-semibold text-foreground">#{order.id.slice(0, 8).toUpperCase()}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Order At</span>
            <span className="text-foreground">{format(new Date(order.created_at), "dd MMM yyyy, hh:mm a")}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Subtotal (MRP)</span>
            <span className="text-foreground">৳{originalTotal}</span>
          </div>
          {discount > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Discount Applied</span>
              <span className="text-emerald-600 dark:text-emerald-400">-৳{discount}</span>
            </div>
          )}
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Delivery Charge</span>
            <span className={order.delivery_charge === 0 ? "text-emerald-600 dark:text-emerald-400" : "text-foreground"}>
              {order.delivery_charge === 0 ? "Free" : `৳${order.delivery_charge}`}
            </span>
          </div>
          <div className="border-t border-border pt-2.5 flex justify-between">
            <span className="text-sm font-bold text-foreground">Amount Payable</span>
            <span className="text-lg font-bold text-primary">৳{order.total_amount}</span>
          </div>

          {/* Download Invoice */}
          <button
            onClick={handleDownloadInvoice}
            className="w-full py-3 bg-primary text-primary-foreground font-semibold rounded-xl flex items-center justify-center gap-2"
          >
            <Download size={16} />
            Download your invoice
          </button>
        </div>
      </div>

      <MobileBottomNav />
    </div>
  );
};

// Status Activity Log Component
const StatusActivityLog = ({ orderId }: { orderId: string }) => {
  const { data: logs = [], isLoading } = useQuery({
    queryKey: ["order-status-logs", orderId],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("order_status_logs")
        .select("*")
        .eq("order_id", orderId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  if (isLoading) return null;
  if (!logs.length) return null;

  const roleLabels: Record<string, string> = {
    admin: "Admin",
    rider: "Rider",
    system: "System",
    user: "Customer",
  };

  const statusLabels: Record<string, string> = {
    pending: "Pending",
    confirmed: "Confirmed",
    processing: "Processing",
    shipped: "Shipped",
    delivered: "Delivered",
    cancelled: "Cancelled",
    assigned: "Assigned",
    picked_up: "Picked Up",
    on_the_way: "On The Way",
  };

  return (
    <div className="bg-card rounded-xl border border-border p-4 space-y-3">
      <div className="flex items-center gap-2">
        <History size={16} className="text-primary" />
        <h3 className="text-sm font-bold text-foreground">Activity Log</h3>
      </div>
      <div className="space-y-2">
        {logs.map((log: any) => (
          <div key={log.id} className="flex items-start gap-3 text-xs">
            <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-foreground">
                <span className="font-medium">{statusLabels[log.previous_status] || log.previous_status || "—"}</span>
                {" → "}
                <span className="font-bold text-primary">{statusLabels[log.new_status] || log.new_status}</span>
              </p>
              {log.note && <p className="text-muted-foreground mt-0.5">{log.note}</p>}
              <p className="text-muted-foreground/60 mt-0.5">
                {format(new Date(log.created_at), "dd MMM, hh:mm a")} • {roleLabels[log.changed_by_role] || log.changed_by_role}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default OrderDetailPage;
