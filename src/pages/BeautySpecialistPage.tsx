import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import PageTopBar from "@/components/PageTopBar";
import MobileBottomNav from "@/components/MobileBottomNav";
import { Sparkles, Clock, Search, Loader2 } from "lucide-react";
import { toast } from "sonner";

const BeautySpecialistPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSpec, setSelectedSpec] = useState<string | null>(null);

  const { data: specialists, isLoading } = useQuery({
    queryKey: ["beauty-specialists-available"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("beauty_specialists")
        .select("*")
        .eq("available", true)
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  const specializations = [...new Set(specialists?.map((s) => s.specialization).filter(Boolean))];

  const filtered = specialists?.filter((s) => {
    const matchesSpec = !selectedSpec || s.specialization === selectedSpec;
    const matchesSearch =
      !searchQuery ||
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.specialization?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSpec && matchesSearch;
  });

  const handleBook = (specialist: any) => {
    if (!user) {
      toast.error("Please login to book an appointment");
      navigate("/auth");
      return;
    }
    navigate("/beauty/specialists/book", { state: { specialist } });
  };

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <PageTopBar title="Beauty Specialists" subtitle="Expert beauty care at your fingertips" />
      <main className="container py-3 max-w-3xl space-y-3">
        {/* Search */}
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search specialists..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-border bg-card text-sm outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>

        {/* Specialization Filters */}
        {specializations.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
            <button
              onClick={() => setSelectedSpec(null)}
              className={`text-[11px] font-semibold px-3 py-1.5 rounded-lg whitespace-nowrap transition-all ${
                !selectedSpec ? "bg-primary text-primary-foreground" : "bg-card border border-border text-muted-foreground"
              }`}
            >
              All
            </button>
            {specializations.map((spec) => (
              <button
                key={spec}
                onClick={() => setSelectedSpec(selectedSpec === spec ? null : spec)}
                className={`text-[11px] font-semibold px-3 py-1.5 rounded-lg whitespace-nowrap transition-all ${
                  selectedSpec === spec ? "bg-primary text-primary-foreground" : "bg-card border border-border text-muted-foreground"
                }`}
              >
                {spec}
              </button>
            ))}
          </div>
        )}

        {/* Specialists List */}
        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="animate-spin text-primary" size={24} />
          </div>
        ) : !filtered?.length ? (
          <div className="text-center py-16">
            <Sparkles size={40} className="mx-auto text-muted-foreground/30 mb-3" />
            <p className="text-sm text-muted-foreground">No specialists available</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {filtered.map((specialist) => (
              <div key={specialist.id} className="bg-card rounded-xl border border-border p-3.5 flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-primary/8 flex items-center justify-center shrink-0 overflow-hidden">
                  {specialist.image_url ? (
                    <img src={specialist.image_url} alt={specialist.name} className="w-full h-full object-cover" />
                  ) : (
                    <Sparkles size={20} className="text-primary" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-[13px] font-bold text-foreground">{specialist.name}</h3>
                  {specialist.specialization && (
                    <p className="text-[10px] text-primary font-medium">{specialist.specialization}</p>
                  )}
                  {specialist.schedule && (
                    <p className="text-[9px] text-muted-foreground flex items-center gap-1 mt-0.5">
                      <Clock size={9} /> {specialist.schedule}
                    </p>
                  )}
                </div>
                <div className="text-right shrink-0">
                  <p className="text-base font-extrabold text-foreground">৳{specialist.fee}</p>
                  <button
                    onClick={() => handleBook(specialist)}
                    className="mt-1 bg-primary text-primary-foreground text-[10px] font-bold px-3 py-1.5 rounded-lg active:scale-95 transition-transform"
                  >
                    Book
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
      <MobileBottomNav />
    </div>
  );
};

export default BeautySpecialistPage;
