import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { MapPin, Plus, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

const AdminDeliveryZones = () => {
  const qc = useQueryClient();
  const [editItem, setEditItem] = useState<any>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const { data: zones = [], isLoading } = useQuery({
    queryKey: ["admin-delivery-zones"],
    queryFn: async () => {
      const { data, error } = await supabase.from("delivery_zones").select("*").order("area");
      if (error) throw error;
      return data;
    },
  });

  const callApi = async (action: string, payload: any) => {
    const { data, error } = await supabase.functions.invoke("admin-general", {
      body: { admin_code: "990990", table: "delivery_zones", action, ...payload },
    });
    if (error) throw error;
    if (data?.error) throw new Error(data.error);
    return data;
  };

  const openNew = () => {
    setEditItem({ area: "", charge: 0, estimated_time: "", active: true });
    setDialogOpen(true);
  };

  const openEdit = (item: any) => {
    setEditItem({ ...item });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!editItem?.area?.trim()) { toast.error("Area name is required"); return; }
    setSaving(true);
    try {
      const payload = {
        area: editItem.area,
        charge: editItem.charge || 0,
        estimated_time: editItem.estimated_time || null,
        active: editItem.active,
      };
      if (editItem.id) {
        await callApi("update", { id: editItem.id, payload });
        toast.success("Zone updated");
      } else {
        await callApi("insert", { payload });
        toast.success("Zone added");
      }
      qc.invalidateQueries({ queryKey: ["admin-delivery-zones"] });
      setDialogOpen(false);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this zone?")) return;
    try {
      await callApi("delete", { id });
      toast.success("Deleted");
      qc.invalidateQueries({ queryKey: ["admin-delivery-zones"] });
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <MapPin size={20} className="text-primary" />
          <h1 className="text-lg font-bold">Delivery Zones</h1>
          <span className="text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">{zones.length}</span>
        </div>
        <Button size="sm" onClick={openNew}><Plus size={14} className="mr-1" /> Add Zone</Button>
      </div>

      <div className="border rounded-xl overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Area</TableHead>
              <TableHead>Charge (৳)</TableHead>
              <TableHead>Est. Time</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-20">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
            ) : zones.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No zones found</TableCell></TableRow>
            ) : zones.map((z) => (
              <TableRow key={z.id}>
                <TableCell className="font-medium">{z.area}</TableCell>
                <TableCell>৳{z.charge}</TableCell>
                <TableCell className="text-xs text-muted-foreground">{z.estimated_time || "—"}</TableCell>
                <TableCell>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${z.active ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-600"}`}>
                    {z.active ? "Active" : "Inactive"}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(z)}><Pencil size={13} /></Button>
                    <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => handleDelete(z.id)}><Trash2 size={13} /></Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{editItem?.id ? "Edit Zone" : "Add Zone"}</DialogTitle>
          </DialogHeader>
          {editItem && (
            <div className="space-y-3">
              <div>
                <Label>Area Name *</Label>
                <Input value={editItem.area} onChange={(e) => setEditItem({ ...editItem, area: e.target.value })} />
              </div>
              <div>
                <Label>Delivery Charge (৳)</Label>
                <Input type="number" value={editItem.charge} onChange={(e) => setEditItem({ ...editItem, charge: parseFloat(e.target.value) || 0 })} />
              </div>
              <div>
                <Label>Estimated Time</Label>
                <Input value={editItem.estimated_time || ""} onChange={(e) => setEditItem({ ...editItem, estimated_time: e.target.value })} placeholder="e.g. 2-3 Hours" />
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={editItem.active} onCheckedChange={(v) => setEditItem({ ...editItem, active: v })} />
                <Label>Active</Label>
              </div>
              <Button onClick={handleSave} disabled={saving} className="w-full">{saving ? "Saving..." : "Save"}</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminDeliveryZones;
