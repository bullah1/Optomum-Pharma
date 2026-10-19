import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, CheckCircle, XCircle, Eye, Download, Search, MessageSquare } from "lucide-react";
import { useState } from "react";

const inputClass = "w-full px-4 py-3 rounded-2xl border border-border bg-secondary/30 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-muted-foreground/50";

const AdminPrescriptions = () => {
  const queryClient = useQueryClient();
  const [viewImage, setViewImage] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "pending" | "verified">("all");
  const [noteInputs, setNoteInputs] = useState<Record<string, string>>({});

const { data: prescriptions, isLoading } = useQuery({
    queryKey: ["admin-prescriptions"],
    queryFn: async () => {
      const { data, error } = await supabase.from("prescriptions").select("*, profiles(name, phone, email)").order("created_at", { ascending: false });
      if (error) throw error;
      // Generate signed URLs for private bucket
      const withUrls = await Promise.all(
        (data || []).map(async (p) => {
          const { data: signedData } = await supabase.storage
            .from("prescriptions")
            .createSignedUrl(p.image_url, 3600); // 1 hour
          return { ...p, signed_url: signedData?.signedUrl || null };
        })
      );
      return withUrls;
    },
  });

  const verifyMutation = useMutation({
    mutationFn: async ({ id, verified }: { id: string; verified: boolean }) => {
      const { error } = await supabase.from("prescriptions").update({ verified }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin-prescriptions"] }); toast.success("Status updated"); },
    onError: (e: any) => toast.error(e.message),
  });

  const updateNote = useMutation({
    mutationFn: async ({ id, notes }: { id: string; notes: string }) => {
      const { error } = await supabase.from("prescriptions").update({ notes }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin-prescriptions"] }); toast.success("Note saved"); },
    onError: (e: any) => toast.error(e.message),
  });

  const filtered = prescriptions?.filter(p => {
    if (filterStatus === "pending" && p.verified) return false;
    if (filterStatus === "verified" && !p.verified) return false;
    if (search) {
      const s = search.toLowerCase();
      const profile = (p as any).profiles;
      return profile?.name?.toLowerCase().includes(s) || profile?.phone?.toLowerCase().includes(s) || p.id.toLowerCase().includes(s);
    }
    return true;
  });

  return (
    <div className="space-y-4">
      {/* Image viewer */}
      {viewImage && (
        <div className="fixed inset-0 bg-foreground/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setViewImage(null)}>
          <div className="relative">
            <img src={viewImage} alt="Prescription" className="max-w-full max-h-[80vh] rounded-3xl shadow-ios-lg" />
            <a href={viewImage} download target="_blank" rel="noopener noreferrer"
              className="absolute bottom-4 right-4 p-2.5 rounded-2xl bg-card/80 backdrop-blur-sm shadow-ios hover:bg-card transition-colors"
              onClick={(e) => e.stopPropagation()}>
              <Download size={18} className="text-foreground" />
            </a>
          </div>
        </div>
      )}

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input placeholder="Search by name, phone..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-3 rounded-2xl border border-border bg-card text-sm outline-none focus:ring-2 focus:ring-primary/20" />
        </div>
        <div className="flex gap-1.5">
          {(["all", "pending", "verified"] as const).map(s => (
            <button key={s} onClick={() => setFilterStatus(s)}
              className={`px-3.5 py-2 rounded-2xl text-xs font-semibold capitalize transition-all ${
                filterStatus === s ? "bg-primary text-primary-foreground shadow-ios" : "bg-secondary text-muted-foreground"
              }`}>
              {s}
            </button>
          ))}
        </div>
      </div>

      <p className="text-sm text-muted-foreground">{filtered?.length ?? 0} prescriptions</p>

      <div className="space-y-3">
        {isLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="animate-spin text-primary" size={28} /></div>
        ) : !filtered?.length ? (
          <div className="bg-card rounded-2xl shadow-ios p-8 text-center text-muted-foreground">No prescriptions found</div>
        ) : (
          filtered.map((p) => {
            const profile = (p as any).profiles;
            return (
              <div key={p.id} className="bg-card rounded-2xl shadow-ios p-4 space-y-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs text-muted-foreground font-mono">{p.id.slice(0, 8)}...</p>
                    <p className="text-sm text-foreground font-medium mt-0.5">
                      {profile?.name || "Unknown"} • {profile?.phone || "—"}
                    </p>
                    <p className="text-xs text-muted-foreground">{profile?.email || "—"}</p>
                    <p className="text-xs text-muted-foreground">{new Date(p.created_at).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setViewImage((p as any).signed_url)} className="p-2 rounded-2xl bg-secondary hover:bg-muted transition-colors active:scale-95" title="View" disabled={!(p as any).signed_url}>
                      <Eye size={16} className="text-foreground" />
                    </button>
                    <a href={(p as any).signed_url || "#"} download target="_blank" rel="noopener noreferrer" className="p-2 rounded-2xl bg-secondary hover:bg-muted transition-colors active:scale-95" title="Download">
                      <Download size={16} className="text-foreground" />
                    </a>
                    <button
                      onClick={() => verifyMutation.mutate({ id: p.id, verified: !p.verified })}
                      className={`flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-xl transition-all active:scale-95 ${
                        p.verified ? "bg-success/15 text-success hover:bg-success/25" : "bg-accent/15 text-accent hover:bg-accent/25"
                      }`}
                    >
                      {p.verified ? <><CheckCircle size={14} /> Verified</> : <><XCircle size={14} /> Pending</>}
                    </button>
                  </div>
                </div>

                {/* Note */}
                <div className="flex gap-2 items-start">
                  <MessageSquare size={14} className="text-muted-foreground mt-2.5" />
                  <input
                    placeholder="Add note (medicine suggestion, remarks...)"
                    value={noteInputs[p.id] ?? p.notes ?? ""}
                    onChange={(e) => setNoteInputs({ ...noteInputs, [p.id]: e.target.value })}
                    className="flex-1 px-3 py-2 rounded-xl border border-border bg-secondary/30 text-xs outline-none focus:ring-2 focus:ring-primary/20"
                  />
                  <button
                    onClick={() => updateNote.mutate({ id: p.id, notes: noteInputs[p.id] ?? "" })}
                    className="px-3 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors"
                  >
                    Save
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default AdminPrescriptions;
