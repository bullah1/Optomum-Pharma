import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Building2, Plus, Search, Pencil, Trash2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import ImageUploader from "@/components/admin/ImageUploader";

const AdminCompanies = () => {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [editItem, setEditItem] = useState<any>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const { data: companies = [], isLoading } = useQuery({
    queryKey: ["admin-companies"],
    queryFn: async () => {
      const { data, error } = await supabase.from("companies").select("*").order("sort_order");
      if (error) throw error;
      return data;
    },
  });

  const filtered = companies.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  const callApi = async (action: string, payload: any) => {
    const { data, error } = await supabase.functions.invoke("admin-general", {
      body: { admin_code: "990990", table: "companies", action, ...payload },
    });
    if (error) throw error;
    if (data?.error) throw new Error(data.error);
    return data;
  };

  const openNew = () => {
    setEditItem({ name: "", slug: "", description: "", address: "", logo_url: "", banner_url: "", active: true, sort_order: 0 });
    setDialogOpen(true);
  };

  const openEdit = (item: any) => {
    setEditItem({ ...item });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!editItem?.name?.trim()) { toast.error("Name is required"); return; }
    setSaving(true);
    try {
      const payload = {
        name: editItem.name,
        slug: editItem.slug || editItem.name.toLowerCase().replace(/\s+/g, "-"),
        description: editItem.description || null,
        address: editItem.address || null,
        logo_url: editItem.logo_url || null,
        banner_url: editItem.banner_url || null,
        active: editItem.active,
        sort_order: editItem.sort_order || 0,
      };
      if (editItem.id) {
        await callApi("update", { id: editItem.id, payload });
        toast.success("Company updated");
      } else {
        await callApi("insert", { payload });
        toast.success("Company added");
      }
      qc.invalidateQueries({ queryKey: ["admin-companies"] });
      setDialogOpen(false);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this company?")) return;
    try {
      await callApi("delete", { id });
      toast.success("Deleted");
      qc.invalidateQueries({ queryKey: ["admin-companies"] });
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Building2 size={20} className="text-primary" />
          <h1 className="text-lg font-bold">Companies / Brands</h1>
          <span className="text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">{companies.length}</span>
        </div>
        <Button size="sm" onClick={openNew}><Plus size={14} className="mr-1" /> Add</Button>
      </div>

      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Search companies..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-9" />
      </div>

      <div className="border rounded-xl overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Logo</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Order</TableHead>
              <TableHead className="w-20">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
            ) : filtered.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No companies found</TableCell></TableRow>
            ) : filtered.map((c) => (
              <TableRow key={c.id}>
                <TableCell>
                  {c.logo_url ? <img src={c.logo_url} alt={c.name} className="w-8 h-8 rounded-lg object-contain bg-secondary" /> : <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center text-xs font-bold">{c.name[0]}</div>}
                </TableCell>
                <TableCell className="font-medium">{c.name}</TableCell>
                <TableCell className="text-xs text-muted-foreground">{c.slug}</TableCell>
                <TableCell>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${c.active ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-600"}`}>
                    {c.active ? "Active" : "Inactive"}
                  </span>
                </TableCell>
                <TableCell className="text-xs">{c.sort_order}</TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(c)}><Pencil size={13} /></Button>
                    <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => handleDelete(c.id)}><Trash2 size={13} /></Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editItem?.id ? "Edit Company" : "Add Company"}</DialogTitle>
          </DialogHeader>
          {editItem && (
            <div className="space-y-3">
              <div>
                <Label>Name *</Label>
                <Input value={editItem.name} onChange={(e) => setEditItem({ ...editItem, name: e.target.value })} />
              </div>
              <div>
                <Label>Slug</Label>
                <Input value={editItem.slug || ""} onChange={(e) => setEditItem({ ...editItem, slug: e.target.value })} placeholder="auto-generated" />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea value={editItem.description || ""} onChange={(e) => setEditItem({ ...editItem, description: e.target.value })} rows={3} />
              </div>
              <div>
                <Label>Address</Label>
                <Input value={editItem.address || ""} onChange={(e) => setEditItem({ ...editItem, address: e.target.value })} />
              </div>
              <div>
                <Label>Logo</Label>
                <ImageUploader value={editItem.logo_url || ""} onChange={(url) => setEditItem({ ...editItem, logo_url: url })} />
              </div>
              <div>
                <Label>Banner</Label>
                <ImageUploader value={editItem.banner_url || ""} onChange={(url) => setEditItem({ ...editItem, banner_url: url })} />
              </div>
              <div className="flex items-center gap-3">
                <Label>Sort Order</Label>
                <Input type="number" value={editItem.sort_order} onChange={(e) => setEditItem({ ...editItem, sort_order: parseInt(e.target.value) || 0 })} className="w-20" />
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

export default AdminCompanies;
