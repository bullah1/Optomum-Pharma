import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Users, Plus, Search, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import ImageUploader from "@/components/admin/ImageUploader";

const AdminTeam = () => {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [editItem, setEditItem] = useState<any>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const { data: members = [], isLoading } = useQuery({
    queryKey: ["admin-team-members"],
    queryFn: async () => {
      const { data, error } = await supabase.from("team_members").select("*").order("sort_order");
      if (error) throw error;
      return data;
    },
  });

  const filtered = members.filter((m: any) =>
    m.name.toLowerCase().includes(search.toLowerCase()) ||
    m.designation?.toLowerCase().includes(search.toLowerCase())
  );

  const callApi = async (action: string, payload: any) => {
    const { data, error } = await supabase.functions.invoke("admin-general", {
      body: { admin_code: "990990", table: "team_members", action, ...payload },
    });
    if (error) throw error;
    if (data?.error) throw new Error(data.error);
    return data;
  };

  const openNew = () => {
    setEditItem({ name: "", designation: "", bio: "", image_url: "", phone: "", email: "", active: true, sort_order: 0 });
    setDialogOpen(true);
  };

  const openEdit = (item: any) => {
    setEditItem({ ...item });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!editItem?.name?.trim()) { toast.error("নাম লিখুন"); return; }
    setSaving(true);
    try {
      const payload = {
        name: editItem.name,
        designation: editItem.designation || "",
        bio: editItem.bio || null,
        image_url: editItem.image_url || null,
        phone: editItem.phone || null,
        email: editItem.email || null,
        active: editItem.active,
        sort_order: editItem.sort_order || 0,
      };
      if (editItem.id) {
        await callApi("update", { id: editItem.id, payload });
        toast.success("আপডেট হয়েছে");
      } else {
        await callApi("insert", { payload });
        toast.success("যোগ হয়েছে");
      }
      qc.invalidateQueries({ queryKey: ["admin-team-members"] });
      setDialogOpen(false);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("এই সদস্য মুছে ফেলতে চান?")) return;
    try {
      await callApi("delete", { id });
      toast.success("মুছে ফেলা হয়েছে");
      qc.invalidateQueries({ queryKey: ["admin-team-members"] });
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Users size={20} className="text-primary" />
          <h1 className="text-lg font-bold">টিম সদস্য</h1>
          <span className="text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">{members.length}</span>
        </div>
        <Button size="sm" onClick={openNew}><Plus size={14} className="mr-1" /> যোগ করুন</Button>
      </div>

      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="সার্চ করুন..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-9" />
      </div>

      <div className="border rounded-xl overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ছবি</TableHead>
              <TableHead>নাম</TableHead>
              <TableHead>পদবি</TableHead>
              <TableHead>স্ট্যাটাস</TableHead>
              <TableHead className="w-20">অ্যাকশন</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">লোড হচ্ছে...</TableCell></TableRow>
            ) : filtered.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">কোনো সদস্য নেই</TableCell></TableRow>
            ) : filtered.map((m: any) => (
              <TableRow key={m.id}>
                <TableCell>
                  {m.image_url ? (
                    <img src={m.image_url} alt={m.name} className="w-8 h-8 rounded-full object-cover bg-secondary" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">{m.name[0]}</div>
                  )}
                </TableCell>
                <TableCell className="font-medium text-sm">{m.name}</TableCell>
                <TableCell className="text-xs text-muted-foreground">{m.designation}</TableCell>
                <TableCell>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${m.active ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-600"}`}>
                    {m.active ? "Active" : "Inactive"}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(m)}><Pencil size={13} /></Button>
                    <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => handleDelete(m.id)}><Trash2 size={13} /></Button>
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
            <DialogTitle>{editItem?.id ? "সদস্য এডিট" : "নতুন সদস্য"}</DialogTitle>
          </DialogHeader>
          {editItem && (
            <div className="space-y-3">
              <div>
                <Label>নাম *</Label>
                <Input value={editItem.name} onChange={(e) => setEditItem({ ...editItem, name: e.target.value })} />
              </div>
              <div>
                <Label>পদবি / Designation</Label>
                <Input value={editItem.designation || ""} onChange={(e) => setEditItem({ ...editItem, designation: e.target.value })} placeholder="e.g. Pharmacist, IT Specialist" />
              </div>
              <div>
                <Label>সংক্ষিপ্ত বায়ো</Label>
                <Textarea value={editItem.bio || ""} onChange={(e) => setEditItem({ ...editItem, bio: e.target.value })} rows={3} />
              </div>
              <div>
                <Label>ছবি</Label>
                <ImageUploader value={editItem.image_url || ""} onChange={(url) => setEditItem({ ...editItem, image_url: url })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>ফোন</Label>
                  <Input value={editItem.phone || ""} onChange={(e) => setEditItem({ ...editItem, phone: e.target.value })} />
                </div>
                <div>
                  <Label>ইমেইল</Label>
                  <Input value={editItem.email || ""} onChange={(e) => setEditItem({ ...editItem, email: e.target.value })} />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Label>ক্রম</Label>
                <Input type="number" value={editItem.sort_order} onChange={(e) => setEditItem({ ...editItem, sort_order: parseInt(e.target.value) || 0 })} className="w-20" />
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={editItem.active} onCheckedChange={(v) => setEditItem({ ...editItem, active: v })} />
                <Label>Active</Label>
              </div>
              <Button onClick={handleSave} disabled={saving} className="w-full">{saving ? "সেভ হচ্ছে..." : "সেভ করুন"}</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminTeam;
