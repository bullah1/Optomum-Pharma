import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Loader2, Mail, Lock, User, Bike, Clock } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

const RiderAuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { user, userRole } = useAuth();

  // Check application status
  const { data: application, isLoading: appLoading } = useQuery({
    queryKey: ["rider-application", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("rider_applications")
        .select("*")
        .eq("user_id", user!.id)
        .maybeSingle();
      return data;
    },
  });

  useEffect(() => {
    if (user && userRole === "rider") navigate("/rider", { replace: true });
    if (user && userRole === "admin") navigate("/rider", { replace: true });
  }, [user, userRole, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Login successful!");
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { name },
            emailRedirectTo: window.location.origin,
          },
        });
        if (error) throw error;

        if (data.user && phone) {
          await supabase.from("profiles").update({ phone, name }).eq("id", data.user.id);
        }

        // Create rider application (NOT role directly)
        if (data.user) {
          await supabase.from("rider_applications").insert({ user_id: data.user.id });
        }

        if (data.user && !data.session) {
          toast.success("Account created! Please check your email to verify.");
        } else {
          toast.success("Application submitted! Admin will review shortly.");
        }
      }
    } catch (err: any) {
      toast.error(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  // Show pending/rejected state for logged-in users
  if (user && application && application.status !== "approved" && userRole !== "rider" && userRole !== "admin") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="w-full max-w-sm text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-amber-500 flex items-center justify-center mx-auto shadow-ios">
            <Clock size={32} className="text-white" />
          </div>
          {application.status === "pending" ? (
            <>
              <h1 className="text-2xl font-bold text-foreground">Application Pending</h1>
              <p className="text-sm text-muted-foreground">Your rider application has been submitted. You can start delivering once approved by admin.</p>
            </>
          ) : (
            <>
              <h1 className="text-2xl font-bold text-destructive">Application Rejected</h1>
              <p className="text-sm text-muted-foreground">Sorry, your rider application has been rejected.</p>
              {application.admin_notes && (
                <p className="text-xs text-muted-foreground bg-secondary rounded-xl p-3">Note: {application.admin_notes}</p>
              )}
            </>
          )}
          <button
            onClick={async () => { await supabase.auth.signOut(); navigate("/rider/login"); }}
            className="px-6 py-2.5 rounded-xl bg-secondary text-foreground text-sm font-semibold"
          >
            Logout
          </button>
        </div>
      </div>
    );
  }

  if (user && appLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="animate-spin text-primary" size={28} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-2">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500 flex items-center justify-center mx-auto shadow-ios">
            <Bike size={32} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Rider Portal</h1>
          <p className="text-sm text-muted-foreground">
            {isLogin ? "Sign in to your rider account" : "Apply as a delivery rider"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-card rounded-2xl shadow-ios p-6 space-y-4">
          {!isLogin && (
            <>
              <div className="relative">
                <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input placeholder="Full Name" value={name} onChange={(e) => setName(e.target.value)} required className="pl-10 rounded-xl" />
              </div>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">📱</span>
                <Input placeholder="Phone Number" value={phone} onChange={(e) => setPhone(e.target.value)} required className="pl-10 rounded-xl" />
              </div>
            </>
          )}

          <div className="relative">
            <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required className="pl-10 rounded-xl" />
          </div>

          <div className="relative">
            <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} className="pl-10 rounded-xl" />
          </div>

          <button type="submit" disabled={loading}
            className="w-full py-3 rounded-xl bg-emerald-500 text-white font-semibold text-sm flex items-center justify-center gap-2 hover:bg-emerald-600 transition-colors disabled:opacity-50">
            {loading ? <Loader2 size={16} className="animate-spin" /> : null}
            {isLogin ? "Sign In" : "Apply as Rider"}
          </button>

          {!isLogin && (
            <p className="text-[10px] text-muted-foreground text-center">
              After submitting your application, you can start working as a rider once approved by admin.
            </p>
          )}
        </form>

        <p className="text-center text-sm text-muted-foreground">
          {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
          <button onClick={() => setIsLogin(!isLogin)} className="text-primary font-semibold hover:underline">
            {isLogin ? "Apply Now" : "Sign In"}
          </button>
        </p>
      </div>
    </div>
  );
};

export default RiderAuthPage;
