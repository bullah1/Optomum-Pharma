import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Star, Trash2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const AdminReviews = () => {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [ratingFilter, setRatingFilter] = useState("all");

  const { data: reviews = [], isLoading } = useQuery({
    queryKey: ["admin-reviews"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reviews")
        .select("*, medicines(name, image_url), profiles(name, email)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const filtered = reviews.filter((r: any) => {
    const matchSearch = !search || 
      r.medicines?.name?.toLowerCase().includes(search.toLowerCase()) ||
      r.profiles?.name?.toLowerCase().includes(search.toLowerCase()) ||
      r.comment?.toLowerCase().includes(search.toLowerCase());
    const matchRating = ratingFilter === "all" || r.rating === parseInt(ratingFilter);
    return matchSearch && matchRating;
  });

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this review?")) return;
    try {
      const { data, error } = await supabase.functions.invoke("admin-general", {
        body: { admin_code: "990990", table: "reviews", action: "delete", id },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast.success("Review deleted");
      qc.invalidateQueries({ queryKey: ["admin-reviews"] });
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const avgRating = reviews.length > 0
    ? (reviews.reduce((s: number, r: any) => s + r.rating, 0) / reviews.length).toFixed(1)
    : "0";

  const ratingDist = [5, 4, 3, 2, 1].map((r) => ({
    stars: r,
    count: reviews.filter((rev: any) => rev.rating === r).length,
    pct: reviews.length > 0 ? Math.round((reviews.filter((rev: any) => rev.rating === r).length / reviews.length) * 100) : 0,
  }));

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Star size={20} className="text-amber-500" />
        <h1 className="text-lg font-bold">Reviews</h1>
        <span className="text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">{reviews.length}</span>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <div className="bg-card border rounded-xl p-4 text-center">
          <p className="text-3xl font-bold text-amber-500">{avgRating}</p>
          <p className="text-xs text-muted-foreground">Avg Rating</p>
          <div className="flex justify-center mt-1">
            {[1, 2, 3, 4, 5].map((s) => (
              <Star key={s} size={12} className={s <= Math.round(parseFloat(avgRating)) ? "text-amber-400 fill-amber-400" : "text-muted"} />
            ))}
          </div>
        </div>
        <div className="bg-card border rounded-xl p-4">
          <p className="text-xs font-semibold text-muted-foreground mb-1">Distribution</p>
          {ratingDist.map((d) => (
            <div key={d.stars} className="flex items-center gap-1.5 text-[10px]">
              <span className="w-3">{d.stars}★</span>
              <div className="flex-1 h-1.5 bg-secondary rounded-full overflow-hidden">
                <div className="h-full bg-amber-400 rounded-full" style={{ width: `${d.pct}%` }} />
              </div>
              <span className="text-muted-foreground w-6 text-right">{d.count}</span>
            </div>
          ))}
        </div>
        <div className="bg-card border rounded-xl p-4 text-center col-span-2 md:col-span-1">
          <p className="text-3xl font-bold text-foreground">{reviews.length}</p>
          <p className="text-xs text-muted-foreground">Total Reviews</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search product, user, comment..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-9" />
        </div>
        <Select value={ratingFilter} onValueChange={setRatingFilter}>
          <SelectTrigger className="w-28 h-9">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Stars</SelectItem>
            {[5, 4, 3, 2, 1].map((r) => (
              <SelectItem key={r} value={String(r)}>{r} Star</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="border rounded-xl overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Rating</TableHead>
              <TableHead>Comment</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
            ) : filtered.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No reviews found</TableCell></TableRow>
            ) : filtered.map((r: any) => (
              <TableRow key={r.id}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {r.medicines?.image_url && <img src={r.medicines.image_url} alt="" className="w-7 h-7 rounded object-cover" />}
                    <span className="text-xs font-medium line-clamp-1">{r.medicines?.name || "Unknown"}</span>
                  </div>
                </TableCell>
                <TableCell className="text-xs">{r.profiles?.name || "Anonymous"}</TableCell>
                <TableCell>
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star key={s} size={11} className={s <= r.rating ? "text-amber-400 fill-amber-400" : "text-muted"} />
                    ))}
                  </div>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">{r.comment || "—"}</TableCell>
                <TableCell className="text-[10px] text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</TableCell>
                <TableCell>
                  <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => handleDelete(r.id)}>
                    <Trash2 size={13} />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default AdminReviews;
