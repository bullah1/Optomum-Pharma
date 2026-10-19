import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Loader2, Mail, Lock, User, ArrowLeft, Building2, Phone, Eye, EyeOff, Package, TrendingUp, Shield } from "lucide-react";

const B2BAuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: siteSettings } = useSiteSettings();
  const siteName = siteSettings?.site_name || "Optimum Pharmaceuticals HLB";
  const siteLogo = siteSettings?.site_logo;

  useEffect(() => {
    if (user) navigate("/", { replace: true });
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Logged in successfully!");
        navigate("/");
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { name, phone, business_name: businessName, account_type: "b2b" },
            emailRedirectTo: window.location.origin,
          },
        });
        if (error) throw error;
        toast.success("B2B account created! You'll see B2B prices after admin approval.");
      }
    } catch (error: any) {
      toast.error(error.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const benefits = [
    { icon: Package, title: "Wholesale Price", desc: "Buy at the best wholesale prices" },
    { icon: TrendingUp, title: "Bulk Discount", desc: "More you buy, more you save" },
    { icon: Shield, title: "Dedicated Support", desc: "24/7 business support" },
  ];

  const inputClass = "pl-10 h-11 rounded-xl border-border bg-background text-sm placeholder:text-muted-foreground/40 focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary/50 transition-all";

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 flex flex-col items-center justify-center px-5 py-8 relative overflow-hidden">
      {/* Decorative background blobs */}
      <div className="absolute top-0 left-0 w-72 h-72 bg-primary/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-accent/10 rounded-full blur-3xl translate-x-1/3 translate-y-1/3" />

      {/* Back to home */}
      <div className="w-full max-w-[400px] mb-6 relative z-10 flex items-center justify-between">
        <Link to="/" className="inline-flex items-center gap-1.5 text-muted-foreground text-xs hover:text-primary transition-colors group">
          <ArrowLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" />
          <span>Back to Home</span>
        </Link>
        <Link to="/auth" className="text-xs text-primary font-medium hover:underline underline-offset-2">
          B2C Login →
        </Link>
      </div>

      <div className="w-full max-w-[400px] relative z-10 animate-fade-in">
        <div className="bg-card/80 backdrop-blur-xl border border-border rounded-2xl p-6 shadow-lg space-y-5">
          {/* Logo + Title */}
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <div className="relative group">
                <div className="absolute -inset-2 rounded-3xl bg-gradient-to-br from-primary/30 via-primary/10 to-accent/20 blur-lg opacity-60 group-hover:opacity-100 transition-opacity duration-500 animate-pulse-soft" />
                <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-br from-card via-card to-primary/5 border-2 border-primary/25 flex items-center justify-center p-2 shadow-xl shadow-primary/10">
                  <img
                    src={siteLogo || "/images/optimum-logo.jpg"}
                    alt={siteName}
                    className="w-full h-full rounded-xl object-contain drop-shadow-sm"
                  />
                </div>
              </div>
            </div>
            <div className="space-y-1">
              <h1 className="text-xl font-bold text-foreground tracking-tight">
                {isLogin ? "B2B Login" : "B2B Registration"}
              </h1>
              <p className="text-[13px] text-muted-foreground">
                Wholesale Partner Portal — <span className="font-semibold text-primary">{siteName}</span>
              </p>
            </div>
          </div>

          {/* Benefits — only on signup */}
          {!isLogin && (
            <div className="grid grid-cols-3 gap-2">
              {benefits.map((b) => (
                <div key={b.title} className="text-center p-3 rounded-xl bg-background border border-border hover:border-primary/20 transition-colors">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-1.5">
                    <b.icon size={14} className="text-primary" />
                  </div>
                  <p className="text-[10px] font-semibold text-foreground leading-tight">{b.title}</p>
                  <p className="text-[9px] text-muted-foreground mt-0.5 leading-tight">{b.desc}</p>
                </div>
              ))}
            </div>
          )}

          {/* Tab toggle */}
          <div className="flex bg-muted/50 rounded-xl p-1">
            <button
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
                isLogin ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Login
            </button>
            <button
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
                !isLogin ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Register
            </button>
          </div>

          {/* Info banner on signup */}
          {!isLogin && (
            <div className="flex items-start gap-2.5 bg-primary/5 border border-primary/15 rounded-xl p-3">
              <Shield size={14} className="text-primary mt-0.5 shrink-0" />
              <p className="text-[11px] text-foreground/70 leading-relaxed">
                After registration, you'll see wholesale prices once approved by admin.
              </p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3.5">
            {!isLogin && (
              <>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground block">Your Name</label>
                  <div className="relative group">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" size={16} />
                    <Input placeholder="Enter name" value={name} onChange={(e) => setName(e.target.value)} className={inputClass} required />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground block">Business / Pharmacy Name</label>
                  <div className="relative group">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" size={16} />
                    <Input placeholder="Enter business name" value={businessName} onChange={(e) => setBusinessName(e.target.value)} className={inputClass} required />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground block">Phone Number</label>
                  <div className="relative group">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" size={16} />
                    <Input placeholder="01XXXXXXXXX" value={phone} onChange={(e) => setPhone(e.target.value)} className={inputClass} required />
                  </div>
                </div>
              </>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground block">Email Address</label>
              <div className="relative group">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" size={16} />
                <Input type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} required />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground block">Password</label>
              <div className="relative group">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" size={16} />
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`${inputClass} pr-10`}
                  minLength={6}
                  required
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/40 hover:text-foreground transition-colors">
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 bg-gradient-to-r from-primary to-primary/85 text-primary-foreground font-semibold text-sm rounded-xl hover:shadow-md hover:shadow-primary/25 active:scale-[0.98] transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="animate-spin" size={16} />}
              {isLogin ? "B2B Login" : "Create B2B Account"}
            </button>
          </form>
        </div>

        {/* Below card */}
        <div className="mt-5 space-y-3 text-center">
          <p className="text-[13px] text-muted-foreground">
            Regular customer?{" "}
            <Link to="/auth" className="text-primary font-semibold hover:underline underline-offset-2">
              B2C Login →
            </Link>
          </p>
          <div className="flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground/60">
            <Shield size={12} />
            <span>Secured with end-to-end encryption</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default B2BAuthPage;
