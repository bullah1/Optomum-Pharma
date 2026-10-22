import { useState, useEffect } from "react";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Search, ChevronDown, ChevronUp, Truck, UserCheck, Package, Phone, MapPin, Mail, Calendar, Hash, FileText, Printer, Download, Filter, MoreHorizontal, Eye, Clock, CheckCircle2, XCircle, CreditCard, BoxSelect, Box, Pencil, Check, X } from "lucide-react";
import { ORDER_STATUS_OPTIONS, getOrderStatusLabel, resolveDisplayOrderStatus } from "@/lib/orderStatus";

const statusTabs = [
  { key: "all", label: "All" },
  { key: "pending", label: "Pending" },
  { key: "payment", label: "Payment" },
  { key: "confirmed", label: "Confirmed" },
  { key: "processing", label: "Processing" },
  { key: "packing", label: "Packing" },
  { key: "packed", label: "Packed" },
  { key: "shipped", label: "Shipped" },
  { key: "delivered", label: "Delivered" },
  { key: "cancelled", label: "Cancelled" },
];

const statusOptions = ORDER_STATUS_OPTIONS;

const statusColors: Record<string, { bg: string; text: string; dot: string }> = {
  pending: { bg: "bg-amber-50 dark:bg-amber-500/10", text: "text-amber-700 dark:text-amber-400", dot: "bg-amber-500" },
  confirmed: { bg: "bg-blue-50 dark:bg-blue-500/10", text: "text-blue-700 dark:text-blue-400", dot: "bg-blue-500" },
  processing: { bg: "bg-violet-50 dark:bg-violet-500/10", text: "text-violet-700 dark:text-violet-400", dot: "bg-violet-500" },
  payment: { bg: "bg-cyan-50 dark:bg-cyan-500/10", text: "text-cyan-700 dark:text-cyan-400", dot: "bg-cyan-500" },
  packing: { bg: "bg-indigo-50 dark:bg-indigo-500/10", text: "text-indigo-700 dark:text-indigo-400", dot: "bg-indigo-500" },
  packed: { bg: "bg-sky-50 dark:bg-sky-500/10", text: "text-sky-700 dark:text-sky-400", dot: "bg-sky-500" },
  shipped: { bg: "bg-purple-50 dark:bg-purple-500/10", text: "text-purple-700 dark:text-purple-400", dot: "bg-purple-500" },
  delivered: { bg: "bg-emerald-50 dark:bg-emerald-500/10", text: "text-emerald-700 dark:text-emerald-400", dot: "bg-emerald-500" },
  cancelled: { bg: "bg-red-50 dark:bg-red-500/10", text: "text-red-700 dark:text-red-400", dot: "bg-red-500" },
};

const generateInvoiceHTML = (order: any, profile: any, assignment: any, settings?: any) => {
  const displayStatus = resolveDisplayOrderStatus(order.status, order.tracking_status);
  const fmt = (n: number) => Math.round(Number(n) || 0).toLocaleString("en-US");
  const items = order.order_items || [];
  const subtotal = items.reduce((s: number, i: any) => s + i.price * i.quantity, 0);
  const originalTotal = items.reduce((s: number, i: any) => {
    const orig = i.medicines?.original_price || i.price;
    return s + orig * i.quantity;
  }, 0);
  const discount = originalTotal - subtotal;
  const companyName = settings?.site_name || "Optimum Pharmaceuticals HLB";
  const companyPhone = settings?.contact_phone || "+8801306383938";
  const companyEmail = settings?.contact_email || "";
  const companyAddress = settings?.contact_address || "Dhaka, Bangladesh";
  const invoiceNo = order.id.slice(0, 8).toUpperCase();
  const orderDate = new Date(order.created_at).toLocaleDateString("en-US", { day: "numeric", month: "long", year: "numeric" });
  
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Invoice #${invoiceNo}</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Segoe UI',Arial,sans-serif;padding:28px 32px;color:#1e293b;max-width:820px;margin:auto;background:#fff}
.header{display:flex;justify-content:space-between;align-items:flex-start;padding-bottom:18px;margin-bottom:0}
.logo-area{display:flex;align-items:center;gap:14px}
.logo-area img{width:52px;height:52px;border-radius:12px;object-fit:contain;border:1.5px solid #e2e8f0}
.company-name{font-size:26px;font-weight:800;color:#F8931D;letter-spacing:-0.5px}
.company-name span{color:#01AEF2}
.company-info{font-size:10.5px;color:#64748b;margin-top:3px;line-height:1.7}
.invoice-badge{text-align:right}
.invoice-badge h2{font-size:13px;font-weight:700;color:#fff;background:linear-gradient(135deg,#F8931D,#E07B0A);padding:6px 16px;border-radius:8px;display:inline-block;letter-spacing:1px;text-transform:uppercase;margin-bottom:8px}
.invoice-meta{font-size:10.5px;color:#475569;line-height:1.8}
.invoice-meta b{color:#1e293b}
.divider{height:3px;background:linear-gradient(90deg,#F8931D,#F8931D 55%,#01AEF2 55%,#01AEF2);border-radius:4px;margin:16px 0}
.section{margin-bottom:16px}
.section-title{font-size:11px;font-weight:700;color:#F8931D;margin-bottom:10px;text-transform:uppercase;letter-spacing:1px;display:flex;align-items:center;gap:6px}
.section-title::before{content:'';width:3px;height:14px;background:#F8931D;border-radius:2px}
.info-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px 24px}
.info-item{font-size:11.5px;color:#475569;padding:4px 0}
.info-item b{color:#1e293b;font-weight:600}
.rider-info{background:linear-gradient(135deg,#f0fdf4,#ecfdf5);border:1px solid #bbf7d0;border-radius:10px;padding:10px 14px;margin:12px 0;font-size:11.5px;display:flex;align-items:center;gap:8px}
table{width:100%;border-collapse:separate;border-spacing:0;margin-top:8px;border-radius:10px;overflow:hidden;border:1px solid #e2e8f0}
th{background:linear-gradient(135deg,#f8fafc,#f1f5f9);text-align:left;padding:10px 12px;font-size:10.5px;font-weight:700;color:#334155;text-transform:uppercase;letter-spacing:0.5px;border-bottom:2px solid #e2e8f0}
td{padding:10px 12px;font-size:12px;border-bottom:1px solid #f1f5f9;color:#334155}
tr:last-child td{border-bottom:none}
tr:hover td{background:#f8fafc}
.text-right{text-align:right}
.totals{margin-top:14px;display:flex;justify-content:flex-end}
.totals-box{min-width:260px;border:1.5px solid #e2e8f0;border-radius:10px;overflow:hidden}
.totals-row{display:flex;justify-content:space-between;padding:8px 16px;font-size:12px;color:#475569;border-bottom:1px solid #f1f5f9}
.totals-row:last-child{border-bottom:none}
.totals-row.discount{color:#dc2626}
.totals-row.grand{background:linear-gradient(135deg,#F8931D,#E07B0A);color:#fff;font-size:14px;font-weight:700;padding:10px 16px}
.qr-section{display:flex;align-items:center;gap:20px;margin-top:20px;padding:18px 20px;background:linear-gradient(135deg,#E6F7FE 0%,#CCEFFD 50%,#A6E4FB 100%);border:1.5px solid #7FD6F8;border-radius:14px}
.qr-section img{width:90px;height:90px;border-radius:10px;border:2px solid #01AEF2}
.qr-text{font-size:12px;color:#1e293b}
.qr-text b{font-size:14px;color:#0092CC;display:block;margin-bottom:4px}
.qr-text p{margin:3px 0;line-height:1.5}
.qr-text .tagline{font-size:10px;color:#64748b;margin-top:6px;padding-top:6px;border-top:1px dashed #A6E4FB;font-style:italic}
.footer{margin-top:20px;text-align:center;font-size:9.5px;color:#94a3b8;border-top:1.5px solid #e2e8f0;padding-top:14px;line-height:1.8}
.footer .brand{font-weight:700;color:#F8931D}
.terms{margin-top:14px;padding:12px 16px;background:#f8fafc;border-radius:10px;border:1px solid #e2e8f0}
.terms p{font-size:9.5px;color:#64748b;line-height:1.6;margin:2px 0}
.terms .title{font-size:10px;font-weight:700;color:#475569;margin-bottom:4px}
@media print{body{padding:16px}button{display:none!important}.qr-section{-webkit-print-color-adjust:exact;print-color-adjust:exact}}
</style></head><body>
<div class="header">
  <div class="logo-area">
    <img src="/images/optimum-logo.jpg" alt="${companyName}" />
    <div>
      <div class="company-name">Optimum <span>HLB</span></div>
      <div class="company-info">
        ${companyPhone}${companyEmail ? ` • ${companyEmail}` : ""}<br/>
        ${companyAddress}
      </div>
    </div>
  </div>
  <div class="invoice-badge">
    <h2>Invoice</h2>
    <div class="invoice-meta">
      <p><b>Invoice #</b> ${invoiceNo}</p>
      <p><b>Date:</b> ${orderDate}</p>
      <p><b>Status:</b> ${getOrderStatusLabel(displayStatus)}</p>
    </div>
  </div>
</div>
<div class="divider"></div>
<div class="section">
  <div class="section-title">Customer Details</div>
  <div class="info-grid">
    <div class="info-item"><b>Name:</b> ${profile?.name || "—"}</div>
    <div class="info-item"><b>Phone:</b> ${profile?.phone || "—"}</div>
    <div class="info-item"><b>Email:</b> ${profile?.email || "—"}</div>
    <div class="info-item"><b>Address:</b> ${order.delivery_address}</div>
  </div>
</div>
${assignment ? `<div class="rider-info">🏍️ <b>Rider:</b> ${(assignment as any).profiles?.name || "Assigned"} — Status: ${assignment.status}</div>` : ""}
<div class="section">
  <div class="section-title">Order Items</div>
  <table>
    <thead><tr><th>#</th><th>Product</th><th>Qty</th><th>MRP</th><th class="text-right">Discount</th><th class="text-right">Amount</th></tr></thead>
    <tbody>${items.map((item: any, i: number) => {
      const mrp = item.medicines?.original_price || item.price;
      const disc = (mrp - item.price) * item.quantity;
      return `<tr><td>${i + 1}</td><td>${item.medicines?.name || "—"}</td><td>${item.quantity}</td><td>৳${fmt(mrp)}</td><td class="text-right">${disc > 0 ? `<span style="color:#dc2626">-৳${fmt(disc)}</span>` : "—"}</td><td class="text-right" style="font-weight:600">৳${fmt(item.price * item.quantity)}</td></tr>`;
    }).join("")}</tbody>
  </table>
</div>
<div class="totals">
  <div class="totals-box">
    <div class="totals-row"><span>Subtotal (MRP)</span><span>৳${fmt(originalTotal)}</span></div>
    ${discount > 0 ? `<div class="totals-row discount"><span>Discount</span><span>-৳${fmt(discount)}</span></div>` : ""}
    <div class="totals-row"><span>Delivery Charge</span><span>${order.delivery_charge === 0 ? "Free" : `৳${fmt(order.delivery_charge)}`}</span></div>
    <div class="totals-row grand"><span>Total Payable</span><span>৳${fmt(order.total_amount)}</span></div>
  </div>
</div>
<div class="terms">
  <p class="title">Terms & Conditions</p>
  <p>• All prices are inclusive of applicable taxes.</p>
  <p>• Products once delivered cannot be returned unless damaged or incorrect.</p>
  <p>• Prescription medicines require valid prescription verification.</p>
  <p>• This is a computer-generated invoice and does not require a signature.</p>
</div>
<div class="qr-section">
  <div style="position:relative;flex-shrink:0">
    <img src="https://api.qrserver.com/v1/create-qr-code/?size=300x300&color=F8931D&bgcolor=FFFFFF&qzone=2&ecc=H&data=${encodeURIComponent("https://optimumpharmahlb.com/install")}" alt="Download App QR"/>
    <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:22px;height:22px;background:#fff;border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 1px 4px rgba(0,0,0,0.15)">
      <span style="font-size:12px;font-weight:bold;color:#059669">M</span>
    </div>
  </div>
  <div class="qr-text">
    <b>📲 Download Optimum Pharmaceuticals HLB App</b>
    <p>Scan this QR code with your phone camera to install the app instantly — no app store needed!</p>
    <p class="tagline">✨ Fast ordering • Live tracking • Exclusive offers</p>
  </div>
</div>
<div class="footer">
  <p>Thank you for choosing <span class="brand">${companyName}</span>! Your health is our priority.</p>
  <p>${companyPhone} • ${companyAddress}</p>
</div>
<script>window.onload=()=>window.print()</script>
</body></html>`;
};

const AdminOrders = () => {
  const queryClient = useQueryClient();
  const { data: siteSettings } = useSiteSettings();
  const [activeTab, setActiveTab] = useState("all");
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [trackingInputs, setTrackingInputs] = useState<Record<string, string>>({});
  const [riderSelect, setRiderSelect] = useState<Record<string, string>>({});
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [selectedOrders, setSelectedOrders] = useState<Set<string>>(new Set());
  const [bulkStatus, setBulkStatus] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<string | null>(null);
  const [customerEdit, setCustomerEdit] = useState<{ name: string; phone: string }>({ name: "", phone: "" });

  const { data: riders } = useQuery({
    queryKey: ["admin-rider-list"],
    queryFn: async () => {
      const { data: roles } = await supabase.from("user_roles").select("user_id").eq("role", "rider");
      if (!roles?.length) return [];
      const ids = roles.map((r: any) => r.user_id);
      const { data: profiles } = await supabase.from("profiles").select("id, name, phone").in("id", ids);
      return profiles || [];
    },
  });

  const { data: assignmentMap } = useQuery({
    queryKey: ["admin-order-assignments"],
    queryFn: async () => {
      const { data } = await supabase.from("rider_assignments").select("order_id, rider_id, status, profiles!rider_assignments_rider_id_fkey(name)");
      const map: Record<string, any> = {};
      data?.forEach((a: any) => { map[a.order_id] = a; });
      return map;
    },
  });

  const { data: orders, isLoading } = useQuery({
    queryKey: ["admin-orders"],
    staleTime: 2 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase.from("orders")
        .select("*, order_items(id, quantity, price, medicines(name, name_bn)), profiles!orders_user_id_profiles_fkey(name, phone, email, address)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      // Guest orders have no profile — show the name/phone captured at checkout
      return (data || []).map((o: any) =>
        o.profiles || !o.guest_phone
          ? o
          : { ...o, profiles: { name: `${o.guest_name || "Guest"} (Guest)`, phone: o.guest_phone, email: null, address: o.delivery_address } }
      );
    },
  });

  const adminOrderApi = async (body: Record<string, any>) => {
    const { data, error } = await supabase.functions.invoke("admin-orders", { body: { admin_code: "990990", ...body } });
    if (error) throw error;
    if (data?.error) throw new Error(data.error);
    return data;
  };

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      await adminOrderApi({ action: "update_status", id, status });
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin-orders"] }); toast.success("Status updated"); },
    onError: (e: any) => toast.error(e.message),
  });

  const updateTracking = useMutation({
    mutationFn: async ({ id, tracking }: { id: string; tracking: string }) => {
      await adminOrderApi({ action: "update_tracking", id, tracking });
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin-orders"] }); toast.success("Tracking updated"); },
    onError: (e: any) => toast.error(e.message),
  });

  const assignRider = useMutation({
    mutationFn: async ({ orderId, riderId }: { orderId: string; riderId: string }) => {
      await adminOrderApi({ action: "assign_rider", order_id: orderId, rider_id: riderId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
      queryClient.invalidateQueries({ queryKey: ["admin-order-assignments"] });
      toast.success("Rider assigned!");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const updateCustomer = useMutation({
    mutationFn: async ({ userId, name, phone }: { userId: string; name: string; phone: string }) => {
      await adminOrderApi({ action: "update_customer", user_id: userId, name, phone });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
      setEditingCustomer(null);
      toast.success("Customer updated");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const handlePrintInvoice = (order: any, profile: any, assignment: any) => {
    const html = generateInvoiceHTML(order, profile, assignment, siteSettings);
    const win = window.open("", "_blank");
    if (win) { win.document.write(html); win.document.close(); }
  };

  const handleDownloadInvoice = (order: any, profile: any, assignment: any) => {
    const html = generateInvoiceHTML(order, profile, assignment, siteSettings).replace(
      '<script>window.onload=()=>window.print()</script>',
      ''
    );
    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.left = "-9999px";
    iframe.style.width = "800px";
    iframe.style.height = "1200px";
    document.body.appendChild(iframe);
    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!doc) { document.body.removeChild(iframe); return; }
    doc.open();
    doc.write(html);
    doc.close();
    setTimeout(() => {
      iframe.contentWindow?.print();
      setTimeout(() => document.body.removeChild(iframe), 1000);
    }, 300);
  };

  useEffect(() => {
    const channel = supabase
      .channel('admin-orders-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' },
        () => { queryClient.invalidateQueries({ queryKey: ["admin-orders"] }); })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'rider_assignments' },
        () => { queryClient.invalidateQueries({ queryKey: ["admin-order-assignments"] }); })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [queryClient]);

  const bulkUpdateStatus = useMutation({
    mutationFn: async ({ ids, status }: { ids: string[]; status: string }) => {
      await adminOrderApi({ action: "bulk_update_status", ids, status });
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin-orders"] }); setSelectedOrders(new Set()); setBulkStatus(""); toast.success("Bulk status updated"); },
    onError: (e: any) => toast.error(e.message),
  });

  const toggleOrderSelect = (id: string) => {
    setSelectedOrders(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const exportCSV = () => {
    if (!filtered?.length) return;
    const header = "Order ID,Customer,Phone,Status,Amount,Delivery,Date,Address\n";
    const rows = filtered.map(o => {
      const p = (o as any).profiles;
      const ds = resolveDisplayOrderStatus(o.status, o.tracking_status);
      return `${o.id.slice(0,8)},${p?.name || "—"},${p?.phone || "—"},${getOrderStatusLabel(ds)},${o.total_amount},${o.delivery_charge},${new Date(o.created_at).toLocaleDateString()},${o.delivery_address.replace(/,/g, " ")}`;
    }).join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "orders.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  const filtered = orders?.filter(o => {
    const ds = resolveDisplayOrderStatus(o.status, o.tracking_status);
    if (activeTab !== "all" && ds !== activeTab) return false;
    if (dateFrom && o.created_at < new Date(dateFrom).toISOString()) return false;
    if (dateTo) {
      const end = new Date(dateTo); end.setDate(end.getDate() + 1);
      if (o.created_at >= end.toISOString()) return false;
    }
    if (search) {
      const s = search.toLowerCase();
      const profile = (o as any).profiles;
      return o.id.toLowerCase().includes(s) || o.delivery_address.toLowerCase().includes(s) ||
        profile?.name?.toLowerCase().includes(s) || profile?.phone?.toLowerCase().includes(s);
    }
    return true;
  });

  const tabCounts = orders?.reduce((acc, o) => {
    const ds = resolveDisplayOrderStatus(o.status, o.tracking_status);
    acc[ds] = (acc[ds] || 0) + 1;
    acc.all = (acc.all || 0) + 1;
    return acc;
  }, {} as Record<string, number>) ?? {};

  const inProgressCount = (tabCounts.confirmed || 0) + (tabCounts.processing || 0) + (tabCounts.payment || 0) + (tabCounts.packing || 0) + (tabCounts.packed || 0);

  const getStatusStyle = (status: string) => statusColors[status] || statusColors.pending;

  return (
    <div className="space-y-4">
      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          { label: "Total Orders", value: tabCounts.all || 0, icon: Package, color: "text-primary" },
          { label: "Pending", value: tabCounts.pending || 0, icon: Clock, color: "text-amber-600" },
          { label: "In Progress", value: inProgressCount, icon: Loader2, color: "text-blue-600" },
          { label: "Shipped", value: tabCounts.shipped || 0, icon: Truck, color: "text-purple-600" },
          { label: "Delivered", value: tabCounts.delivered || 0, icon: CheckCircle2, color: "text-emerald-600" },
        ].map((stat, i) => (
          <div key={i} className="bg-card rounded-xl border border-border p-4 flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg bg-secondary/60 flex items-center justify-center ${stat.color}`}>
              <stat.icon size={18} />
            </div>
            <div>
              <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
              <p className="text-[10px] text-muted-foreground">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="bg-card rounded-xl border border-border p-3">
        <div className="flex flex-col sm:flex-row gap-2.5">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              placeholder="Search orders..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-lg bg-secondary/40 border-0 text-sm outline-none focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground/60"
            />
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowFilters(!showFilters)}
              className={`px-3 py-2 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors ${showFilters ? "bg-primary text-primary-foreground" : "bg-secondary/60 text-muted-foreground hover:text-foreground"}`}>
              <Filter size={13} /> Filters
            </button>
            <button onClick={exportCSV}
              className="px-3 py-2 rounded-lg bg-secondary/60 text-muted-foreground hover:text-foreground text-xs font-medium flex items-center gap-1.5 transition-colors">
              <Download size={13} /> Export
            </button>
          </div>
        </div>

        {showFilters && (
          <div className="flex gap-2 mt-2.5 pt-2.5 border-t border-border">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-muted-foreground">From:</span>
              <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
                className="px-2 py-1.5 rounded-lg bg-secondary/40 text-xs outline-none" />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-muted-foreground">To:</span>
              <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
                className="px-2 py-1.5 rounded-lg bg-secondary/40 text-xs outline-none" />
            </div>
            {(dateFrom || dateTo) && (
              <button onClick={() => { setDateFrom(""); setDateTo(""); }}
                className="text-[10px] text-destructive hover:underline">Clear</button>
            )}
          </div>
        )}
      </div>

      {/* Bulk Actions */}
      {selectedOrders.size > 0 && (
        <div className="flex items-center gap-3 bg-primary/5 border border-primary/20 rounded-xl px-4 py-3">
          <span className="text-sm font-semibold text-primary">{selectedOrders.size} selected</span>
          <select value={bulkStatus} onChange={e => setBulkStatus(e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-border bg-card text-xs outline-none">
            <option value="">Change Status...</option>
            {statusOptions.map(s => <option key={s} value={s}>{getOrderStatusLabel(s)}</option>)}
          </select>
          <button onClick={() => bulkStatus && bulkUpdateStatus.mutate({ ids: Array.from(selectedOrders), status: bulkStatus })}
            disabled={!bulkStatus || bulkUpdateStatus.isPending}
            className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold disabled:opacity-50">
            {bulkUpdateStatus.isPending ? "..." : "Apply"}
          </button>
          <button onClick={() => setSelectedOrders(new Set())} className="text-xs text-muted-foreground ml-auto hover:text-foreground">Clear</button>
        </div>
      )}

      {/* Status Tabs */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
        {statusTabs.map(t => {
          const count = tabCounts[t.key] || 0;
          const isActive = activeTab === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={`px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "bg-card border border-border text-muted-foreground hover:text-foreground hover:border-primary/30"
              }`}
            >
              {t.label}
              {count > 0 && (
                <span className={`ml-1.5 text-[10px] px-1.5 py-0.5 rounded-md ${isActive ? "bg-primary-foreground/20" : "bg-secondary"}`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Orders Table/List */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 className="animate-spin text-primary" size={24} />
          <p className="text-xs text-muted-foreground">Loading orders...</p>
        </div>
      ) : !filtered?.length ? (
        <div className="bg-card rounded-xl border border-border p-16 text-center">
          <Package size={40} className="text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">No orders found</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((order) => {
            const expanded = expandedId === order.id;
            const profile = (order as any).profiles;
            const displayStatus = resolveDisplayOrderStatus(order.status, order.tracking_status);
            const sColor = getStatusStyle(displayStatus);
            const assignment = assignmentMap?.[order.id];
            const itemCount = order.order_items?.reduce((s: number, i: any) => s + i.quantity, 0) || 0;

            return (
              <div key={order.id} className={`bg-card rounded-xl border transition-all ${expanded ? "border-primary/30 shadow-sm" : "border-border hover:border-border"}`}>
                {/* Order Row */}
                <div className="p-3 sm:p-4">
                  <div className="flex items-center gap-3">
                    {/* Checkbox */}
                    <input type="checkbox" checked={selectedOrders.has(order.id)} onChange={() => toggleOrderSelect(order.id)}
                      className="w-4 h-4 rounded border-border text-primary accent-primary shrink-0" />

                    {/* Main Info */}
                    <div className="flex-1 min-w-0 grid grid-cols-1 sm:grid-cols-[1fr_auto_auto_auto] gap-2 sm:gap-4 items-center">
                      {/* Customer + Order ID */}
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-foreground truncate">{profile?.name || "Unknown"}</p>
                          <span className={`shrink-0 inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${sColor.bg} ${sColor.text}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${sColor.dot}`} />
                            {getOrderStatusLabel(displayStatus)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2.5 mt-0.5">
                          <span className="text-[10px] text-muted-foreground font-mono">#{order.id.slice(0, 8)}</span>
                          <span className="text-[10px] text-muted-foreground">{profile?.phone || "—"}</span>
                          <span className="text-[10px] text-muted-foreground">
                            {new Date(order.created_at).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "2-digit" })}
                          </span>
                        </div>
                      </div>

                      {/* Items count */}
                      <div className="hidden sm:block text-center">
                        <p className="text-xs font-medium text-foreground">{itemCount} items</p>
                      </div>

                      {/* Amount */}
                      <div className="hidden sm:block text-right">
                        <p className="text-sm font-bold text-foreground">৳{order.total_amount}</p>
                        <p className="text-[10px] text-muted-foreground">+৳{order.delivery_charge} delivery</p>
                      </div>

                      {/* Status Dropdown */}
                      <div className="hidden sm:block">
                        <select
                          className="text-[11px] border border-border rounded-lg px-2 py-1.5 bg-secondary/30 text-foreground outline-none focus:ring-1 focus:ring-primary/30 cursor-pointer w-[110px]"
                          value={displayStatus}
                          onChange={(e) => updateStatus.mutate({ id: order.id, status: e.target.value })}
                        >
                          {statusOptions.map((s) => <option key={s} value={s}>{getOrderStatusLabel(s)}</option>)}
                        </select>
                      </div>
                    </div>

                    {/* Mobile: Amount + Expand */}
                    <div className="sm:hidden text-right shrink-0">
                      <p className="text-sm font-bold text-foreground">৳{order.total_amount}</p>
                    </div>

                    {/* Expand Toggle */}
                    <button
                      onClick={() => setExpandedId(expanded ? null : order.id)}
                      className="p-1.5 rounded-lg hover:bg-secondary/60 text-muted-foreground transition-colors shrink-0"
                    >
                      {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                  </div>

                  {/* Rider Badge - inline */}
                  {assignment && (
                    <div className="mt-2 ml-7 sm:ml-7">
                      <span className="inline-flex items-center gap-1.5 text-[10px] font-medium text-foreground bg-secondary/50 px-2 py-1 rounded-md">
                        🏍️ {(assignment as any).profiles?.name || "Rider"}
                        <span className={`text-[9px] px-1 py-0.5 rounded font-bold ${
                          assignment.status === "delivered" ? "bg-emerald-500/10 text-emerald-600" :
                          assignment.status === "picked_up" ? "bg-amber-500/10 text-amber-600" :
                          "bg-primary/10 text-primary"
                        }`}>{assignment.status}</span>
                      </span>
                    </div>
                  )}
                </div>

                {/* Expanded Panel */}
                {expanded && (
                  <div className="border-t border-border bg-secondary/5">
                    <div className="p-4 space-y-4">
                      {/* Quick Actions Row */}
                      <div className="flex flex-wrap gap-2">
                        {/* Mobile Status Dropdown */}
                        <div className="sm:hidden">
                          <select
                            className="text-[11px] border border-border rounded-lg px-2.5 py-2 bg-card text-foreground outline-none"
                            value={displayStatus}
                            onChange={(e) => updateStatus.mutate({ id: order.id, status: e.target.value })}
                          >
                            {statusOptions.map((s) => <option key={s} value={s}>{getOrderStatusLabel(s)}</option>)}
                          </select>
                        </div>
                        <button onClick={() => handlePrintInvoice(order, profile, assignment)}
                          className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-card border border-border text-xs font-medium text-muted-foreground hover:text-foreground transition-colors">
                          <Printer size={13} /> Print
                        </button>
                        <button onClick={() => handleDownloadInvoice(order, profile, assignment)}
                          className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-card border border-border text-xs font-medium text-muted-foreground hover:text-foreground transition-colors">
                          <Download size={13} /> Download
                        </button>
                      </div>

                      {/* Two Column Layout */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Left: Customer Info */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <h4 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Customer</h4>
                            {editingCustomer !== order.id && (
                              <button
                                onClick={() => {
                                  setCustomerEdit({ name: profile?.name || "", phone: profile?.phone || "" });
                                  setEditingCustomer(order.id);
                                }}
                                className="flex items-center gap-1 text-[10px] font-medium text-primary hover:text-primary/80"
                              >
                                <Pencil size={11} /> Edit
                              </button>
                            )}
                          </div>
                          {editingCustomer === order.id ? (
                            <div className="space-y-2">
                              <input
                                type="text"
                                placeholder="Customer name"
                                value={customerEdit.name}
                                onChange={(e) => setCustomerEdit({ ...customerEdit, name: e.target.value })}
                                className="w-full px-2.5 py-1.5 rounded-lg border border-border bg-card text-xs outline-none focus:border-primary"
                              />
                              <input
                                type="tel"
                                placeholder="Phone number"
                                value={customerEdit.phone}
                                onChange={(e) => setCustomerEdit({ ...customerEdit, phone: e.target.value })}
                                className="w-full px-2.5 py-1.5 rounded-lg border border-border bg-card text-xs outline-none focus:border-primary"
                              />
                              <div className="flex items-start gap-2 text-xs">
                                <Mail size={12} className="text-muted-foreground mt-0.5 shrink-0" />
                                <span className="text-muted-foreground">{profile?.email || "—"}</span>
                              </div>
                              <div className="flex items-start gap-2 text-xs">
                                <MapPin size={12} className="text-muted-foreground mt-0.5 shrink-0" />
                                <span className="text-muted-foreground">{order.delivery_address}</span>
                              </div>
                              <div className="flex gap-2 pt-1">
                                <button
                                  onClick={() => updateCustomer.mutate({ userId: order.user_id, name: customerEdit.name, phone: customerEdit.phone })}
                                  disabled={updateCustomer.isPending}
                                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold disabled:opacity-50"
                                >
                                  <Check size={12} /> Save
                                </button>
                                <button
                                  onClick={() => setEditingCustomer(null)}
                                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-secondary text-foreground text-xs font-medium"
                                >
                                  <X size={12} /> Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-1.5">
                              {[
                                { icon: UserCheck, value: profile?.name || "—" },
                                { icon: Phone, value: profile?.phone || "—" },
                                { icon: Mail, value: profile?.email || "—" },
                                { icon: MapPin, value: order.delivery_address },
                              ].map((info, i) => (
                                <div key={i} className="flex items-start gap-2 text-xs">
                                  <info.icon size={12} className="text-muted-foreground mt-0.5 shrink-0" />
                                  <span className="text-foreground">{info.value}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Right: Rider Assignment */}
                        <div className="space-y-2">
                          <h4 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Rider</h4>
                          <div className="flex gap-2 items-center">
                            <select
                              className="flex-1 px-2.5 py-2 rounded-lg border border-border bg-card text-xs outline-none"
                              value={riderSelect[order.id] || (assignment?.rider_id ?? "")}
                              onChange={(e) => setRiderSelect({ ...riderSelect, [order.id]: e.target.value })}
                            >
                              <option value="">Select Rider</option>
                              {riders?.map((r: any) => (
                                <option key={r.id} value={r.id}>{r.name || r.phone || r.id.slice(0, 8)}</option>
                              ))}
                            </select>
                            <button
                              onClick={() => riderSelect[order.id] && assignRider.mutate({ orderId: order.id, riderId: riderSelect[order.id] })}
                              disabled={!riderSelect[order.id] || assignRider.isPending}
                              className="px-3 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-semibold disabled:opacity-50">
                              {assignRider.isPending ? "..." : "Assign"}
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Order Items */}
                      {order.order_items?.length > 0 && (
                        <div>
                          <h4 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Items ({order.order_items.length})</h4>
                          <div className="bg-card rounded-lg border border-border overflow-hidden">
                            <table className="w-full text-xs">
                              <thead>
                                <tr className="border-b border-border bg-secondary/30">
                                  <th className="text-left py-2 px-3 font-medium text-muted-foreground">Product</th>
                                  <th className="text-center py-2 px-3 font-medium text-muted-foreground w-16">Qty</th>
                                  <th className="text-right py-2 px-3 font-medium text-muted-foreground w-20">Price</th>
                                  <th className="text-right py-2 px-3 font-medium text-muted-foreground w-20">Total</th>
                                </tr>
                              </thead>
                              <tbody>
                                {order.order_items.map((item: any) => (
                                  <tr key={item.id} className="border-b border-border last:border-0">
                                    <td className="py-2 px-3 text-foreground font-medium">{item.medicines?.name || "—"}</td>
                                    <td className="py-2 px-3 text-center text-muted-foreground">{item.quantity}</td>
                                    <td className="py-2 px-3 text-right text-muted-foreground">৳{item.price}</td>
                                    <td className="py-2 px-3 text-right font-semibold text-foreground">৳{item.price * item.quantity}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}

                      {/* Summary */}
                      <div className="flex justify-end">
                        <div className="w-full sm:w-64 space-y-1.5 bg-card rounded-lg border border-border p-3">
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>Subtotal</span>
                            <span>৳{(order.order_items || []).reduce((s: number, i: any) => s + i.price * i.quantity, 0)}</span>
                          </div>
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>Delivery</span>
                            <span>৳{order.delivery_charge}</span>
                          </div>
                          <div className="flex justify-between text-sm font-bold pt-1.5 border-t border-border">
                            <span>Total</span>
                            <span className="text-primary">৳{order.total_amount}</span>
                          </div>
                        </div>
                      </div>

                      {/* Tracking */}
                      <div>
                        <h4 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Tracking</h4>
                        <div className="flex gap-2 items-center">
                          <Truck size={14} className="text-muted-foreground shrink-0" />
                          <input
                            placeholder="Tracking ID / Status"
                            value={trackingInputs[order.id] ?? order.tracking_status ?? ""}
                            onChange={(e) => setTrackingInputs({ ...trackingInputs, [order.id]: e.target.value })}
                            className="flex-1 px-3 py-2 rounded-lg border border-border bg-card text-xs outline-none focus:ring-1 focus:ring-primary/30"
                          />
                          <button
                            onClick={() => updateTracking.mutate({ id: order.id, tracking: trackingInputs[order.id] ?? "" })}
                            className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors">
                            Save
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AdminOrders;
