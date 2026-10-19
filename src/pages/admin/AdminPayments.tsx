import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { CreditCard, TrendingUp, Download, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";

type Period = "7d" | "30d" | "90d" | "all";

const AdminPayments = () => {
  const [period, setPeriod] = useState<Period>("30d");

  const { data: payments = [] } = useQuery({
    queryKey: ["admin-payments-all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payments")
        .select("*, profiles(name, phone), orders(status)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: orders = [] } = useQuery({
    queryKey: ["admin-orders-revenue"],
    queryFn: async () => {
      const { data, error } = await supabase.from("orders").select("total_amount, delivery_charge, status, created_at");
      if (error) throw error;
      return data;
    },
  });

  const { data: labBookings = [] } = useQuery({
    queryKey: ["admin-lab-revenue"],
    queryFn: async () => {
      const { data, error } = await { data: [], error: null } as any; // lab disabled
      if (error) throw error;
      return data;
    },
  });

  const { data: appointments = [] } = useQuery({
    queryKey: ["admin-appt-revenue"],
    queryFn: async () => {
      const { data, error } = await supabase.from("doctor_appointments").select("consultation_fee, status, created_at");
      if (error) throw error;
      return data;
    },
  });

  const getStart = (p: Period) => {
    const now = new Date();
    if (p === "7d") { now.setDate(now.getDate() - 7); return now; }
    if (p === "30d") { now.setDate(now.getDate() - 30); return now; }
    if (p === "90d") { now.setDate(now.getDate() - 90); return now; }
    return new Date(0);
  };

  const stats = useMemo(() => {
    const start = getStart(period).toISOString();
    const filtOrders = orders.filter((o) => o.created_at >= start && o.status !== "cancelled");
    const filtLab = labBookings.filter((l) => l.created_at >= start && l.status !== "cancelled");
    const filtAppt = appointments.filter((a) => a.created_at >= start && a.status !== "cancelled");

    const orderRevenue = filtOrders.reduce((s, o) => s + Number(o.total_amount), 0);
    const labRevenue = filtLab.reduce((s, l) => s + Number(l.total_amount), 0);
    const apptRevenue = filtAppt.reduce((s, a) => s + Number(a.consultation_fee), 0);

    return {
      totalRevenue: orderRevenue + labRevenue + apptRevenue,
      orderRevenue,
      labRevenue,
      apptRevenue,
      totalOrders: filtOrders.length,
      totalLab: filtLab.length,
      totalAppt: filtAppt.length,
    };
  }, [orders, labBookings, appointments, period]);

  // Revenue trend chart
  const trendData = useMemo(() => {
    const days = period === "7d" ? 7 : period === "30d" ? 30 : period === "90d" ? 90 : 60;
    const start = getStart(period).toISOString();
    const result: { label: string; orders: number; lab: number; appt: number }[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const key = d.toISOString().split("T")[0];
      const label = d.toLocaleDateString("en-US", { day: "numeric", month: "short" });
      result.push({
        label,
        orders: orders.filter((o) => o.created_at.startsWith(key) && o.status !== "cancelled").reduce((s, o) => s + Number(o.total_amount), 0),
        lab: labBookings.filter((l) => l.created_at.startsWith(key) && l.status !== "cancelled").reduce((s, l) => s + Number(l.total_amount), 0),
        appt: appointments.filter((a) => a.created_at.startsWith(key) && a.status !== "cancelled").reduce((s, a) => s + Number(a.consultation_fee), 0),
      });
    }
    return result;
  }, [orders, labBookings, appointments, period]);

  const pieData = [
    { name: "Product Orders", value: stats.orderRevenue },
    { name: "Lab Tests", value: stats.labRevenue },
    { name: "Consultations", value: stats.apptRevenue },
  ].filter((d) => d.value > 0);
  const PIE_COLORS = ["hsl(var(--primary))", "#8b5cf6", "#ec4899"];

  const exportCSV = () => {
    const start = getStart(period).toISOString();
    const filtPayments = payments.filter((p: any) => p.created_at >= start);
    const csv = [
      "Date,Customer,Method,Amount,Status,Order Status",
      ...filtPayments.map((p: any) =>
        `${new Date(p.created_at).toLocaleDateString()},${p.profiles?.name || "N/A"},${p.method},${p.amount},${p.status},${p.orders?.status || "N/A"}`
      ),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `payments-${period}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const tooltipStyle = { background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12, fontSize: 12 };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <CreditCard size={20} className="text-primary" />
          <h1 className="text-lg font-bold">Payments & Revenue</h1>
        </div>
        <div className="flex gap-2">
          <Select value={period} onValueChange={(v) => setPeriod(v as Period)}>
            <SelectTrigger className="w-32 h-9"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 Days</SelectItem>
              <SelectItem value="30d">Last 30 Days</SelectItem>
              <SelectItem value="90d">Last 90 Days</SelectItem>
              <SelectItem value="all">All Time</SelectItem>
            </SelectContent>
          </Select>
          <Button size="sm" variant="outline" onClick={exportCSV}>
            <Download size={14} className="mr-1" /> Export
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Total Revenue", value: stats.totalRevenue, color: "text-primary" },
          { label: "Order Revenue", value: stats.orderRevenue, color: "text-emerald-600" },
          { label: "Lab Revenue", value: stats.labRevenue, color: "text-violet-600" },
          { label: "Consultation Revenue", value: stats.apptRevenue, color: "text-pink-600" },
        ].map((k) => (
          <div key={k.label} className="bg-card border rounded-xl p-4">
            <p className={`text-xl font-bold ${k.color}`}>৳{k.value.toLocaleString()}</p>
            <p className="text-[11px] text-muted-foreground">{k.label}</p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-card border rounded-xl p-4">
          <h3 className="text-sm font-bold mb-3">Revenue Trend</h3>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={trendData}>
              <defs>
                <linearGradient id="gOrd" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="label" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Area type="monotone" dataKey="orders" stroke="hsl(var(--primary))" fill="url(#gOrd)" strokeWidth={2} name="Orders" />
              <Area type="monotone" dataKey="lab" stroke="#8b5cf6" fill="transparent" strokeWidth={1.5} strokeDasharray="4 4" name="Lab" />
              <Area type="monotone" dataKey="appt" stroke="#ec4899" fill="transparent" strokeWidth={1.5} strokeDasharray="4 4" name="Appointments" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-card border rounded-xl p-4">
          <h3 className="text-sm font-bold mb-3">Revenue Split</h3>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" paddingAngle={3}>
                  {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => `৳${v.toLocaleString()}`} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-center text-sm text-muted-foreground py-16">No data</p>
          )}
        </div>
      </div>

      {/* Recent Payments Table */}
      <div>
        <h3 className="text-sm font-bold mb-2">Recent Payments</h3>
        <div className="border rounded-xl overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No payments yet</TableCell></TableRow>
              ) : payments.slice(0, 20).map((p: any) => (
                <TableRow key={p.id}>
                  <TableCell className="text-xs">{new Date(p.created_at).toLocaleDateString()}</TableCell>
                  <TableCell className="text-xs font-medium">{p.profiles?.name || "N/A"}</TableCell>
                  <TableCell>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-secondary">{p.method}</span>
                  </TableCell>
                  <TableCell className="font-medium">৳{Number(p.amount).toLocaleString()}</TableCell>
                  <TableCell>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                      p.status === "completed" ? "bg-emerald-100 text-emerald-700" :
                      p.status === "pending" ? "bg-amber-100 text-amber-700" :
                      "bg-red-100 text-red-600"
                    }`}>{p.status}</span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
};

export default AdminPayments;
