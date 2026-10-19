import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Shield, Loader2 } from "lucide-react";
import { toast } from "sonner";

const ADMIN_CODE = "990990";

const AdminLoginPage = () => {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleDigit = (digit: string) => {
    if (code.length < 6) {
      const newCode = code + digit;
      setCode(newCode);
      if (newCode.length === 6) {
        verifyCode(newCode);
      }
    }
  };

  const handleDelete = () => {
    setCode(code.slice(0, -1));
  };

  const verifyCode = (inputCode: string) => {
    setLoading(true);
    setTimeout(() => {
      if (inputCode === ADMIN_CODE) {
        localStorage.setItem("admin_code_verified", "true");
        toast.success("Admin Access Granted!");
        navigate("/admin");
      } else {
        toast.error("ভুল কোড!");
        setCode("");
      }
      setLoading(false);
    }, 500);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-xs space-y-8 text-center">
        <div className="space-y-2">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
            <Shield size={32} className="text-primary" />
          </div>
          <h1 className="text-xl font-bold text-foreground">Admin Access</h1>
          <p className="text-sm text-muted-foreground">৬ ডিজিটের কোড দিন</p>
        </div>

        {/* Dots */}
        <div className="flex justify-center gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className={`w-3.5 h-3.5 rounded-full transition-all duration-200 ${
                i < code.length
                  ? "bg-primary scale-110"
                  : "bg-border"
              }`}
            />
          ))}
        </div>

        {loading && (
          <Loader2 size={24} className="animate-spin text-primary mx-auto" />
        )}

        {/* Keypad */}
        <div className="grid grid-cols-3 gap-3 max-w-[240px] mx-auto">
          {["1","2","3","4","5","6","7","8","9","","0","⌫"].map((key) => (
            <button
              key={key}
              disabled={loading || key === ""}
              onClick={() => key === "⌫" ? handleDelete() : handleDigit(key)}
              className={`h-14 rounded-2xl text-lg font-semibold transition-all active:scale-95 ${
                key === ""
                  ? "invisible"
                  : key === "⌫"
                  ? "text-muted-foreground hover:bg-secondary"
                  : "bg-card border border-border text-foreground hover:bg-secondary active:bg-primary/10"
              }`}
            >
              {key}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminLoginPage;
