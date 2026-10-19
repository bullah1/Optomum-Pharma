import { useState, useEffect } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Loader2, ArrowLeft, Eye, EyeOff, Building2 } from "lucide-react";

const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { user, userRole } = useAuth();
  const { data: siteSettings } = useSiteSettings();
  const siteName = siteSettings?.site_name || "Optimum Pharmaceuticals HLB";
  const siteLogo = siteSettings?.site_logo;

  // After login, send the customer back where they were (e.g. cart / checkout)
  const [searchParams] = useSearchParams();
  const rawRedirect = searchParams.get("redirect") || "/";
  const redirectTo = rawRedirect.startsWith("/") && !rawRedirect.startsWith("//") ? rawRedirect : "/";

  useEffect(() => {
    if (user && userRole) {
      if (userRole === "rider") navigate("/rider", { replace: true });
      else navigate(redirectTo, { replace: true });
    }
  }, [user, userRole, navigate, redirectTo]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Logged in successfully!");
        navigate(redirectTo, { replace: true });
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { name, phone },
            emailRedirectTo: window.location.origin,
          },
        });
        if (error) throw error;
        if (data.session) {
          toast.success("Account created! 🎉");
          navigate(redirectTo, { replace: true });
        } else {
          const { error: signInErr } = await supabase.auth.signInWithPassword({ email, password });
          if (signInErr) throw signInErr;
          toast.success("Account created! 🎉");
          navigate(redirectTo, { replace: true });
        }
      }
    } catch (error: any) {
      toast.error(error.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };



  return (
    <div className="min-h-screen bg-background flex flex-col px-5 py-6">
      {/* Back to home */}
      <Link to="/" className="inline-flex items-center gap-1.5 text-muted-foreground text-sm hover:text-primary transition-colors w-fit">
        <ArrowLeft size={16} />
        <span>Back to Home</span>
      </Link>

      <div className="flex-1 flex flex-col justify-center max-w-[400px] w-full mx-auto py-6">
        {/* Logo + Title */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl overflow-hidden bg-primary/5 border border-border p-1.5">
            <img
              src={siteLogo || "/images/optimum-logo.jpg"}
              alt={siteName}
              className="w-full h-full rounded-xl object-contain"
            />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-1">
            {isLogin ? "Welcome Back 👋" : "Create Account"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {isLogin ? "Sign in to your account" : "Get started in 30 seconds"}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3">
          {!isLogin && (
            <>
              <div>
                <label className="text-sm font-medium text-foreground block mb-1.5">Full Name</label>
                <Input
                  placeholder="e.g. John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="h-12 rounded-xl text-base"
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground block mb-1.5">Phone Number</label>
                <Input
                  type="tel"
                  placeholder="01XXXXXXXXX"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="h-12 rounded-xl text-base"
                  required
                />
              </div>
            </>
          )}
          <div>
            <label className="text-sm font-medium text-foreground block mb-1.5">Email</label>
            <Input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-12 rounded-xl text-base"
              required
            />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground block mb-1.5">Password</label>
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="At least 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-12 pr-12 rounded-xl text-base"
                minLength={6}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-12 bg-primary text-primary-foreground font-bold text-base rounded-xl hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2 mt-5"
          >
            {loading && <Loader2 className="animate-spin" size={18} />}
            {isLogin ? "Sign In" : "Create Account"}
          </button>
        </form>

        {/* Toggle */}
        <p className="text-center text-sm text-muted-foreground mt-5">
          {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-primary font-bold hover:underline"
          >
            {isLogin ? "Sign Up" : "Sign In"}
          </button>
        </p>

        {/* B2B link */}
        <Link
          to="/auth/b2b"
          className="flex items-center justify-center gap-2 mt-6 py-3 text-xs text-muted-foreground hover:text-primary transition-colors"
        >
          <Building2 size={14} />
          <span>Business Account (B2B)</span>
        </Link>
      </div>
    </div>
  );
};

export default AuthPage;
