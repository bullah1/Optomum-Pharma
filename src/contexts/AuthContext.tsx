import { createContext, useContext, useEffect, useState, useRef, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  userRole: "admin" | "b2b" | "rider" | "user" | null;
  isB2B: boolean;
  isRider: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<"admin" | "b2b" | "rider" | "user" | null>(null);
  const roleFetchedForRef = useRef<string | null>(null);

  const fetchRole = async (userId: string) => {
    // Deduplicate: don't fetch if already fetched for this user
    if (roleFetchedForRef.current === userId) return;
    roleFetchedForRef.current = userId;
    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);
    if (data && data.length > 0) {
      const roles = data.map((r: any) => r.role);
      if (roles.includes("admin")) setUserRole("admin");
      else if (roles.includes("rider")) setUserRole("rider");
      else if (roles.includes("b2b")) setUserRole("b2b");
      else setUserRole("user");
    } else {
      setUserRole("user");
    }
  };

  useEffect(() => {
    // Get initial session first
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      if (session?.user) {
        fetchRole(session.user.id);
      }
    });

    // Then listen for changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      if (session?.user) {
        fetchRole(session.user.id);
      } else {
        setUserRole(null);
        roleFetchedForRef.current = null;
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUserRole(null);
  };

  const isB2B = userRole === "b2b" || userRole === "admin";
  const isRider = userRole === "rider";

  return (
    <AuthContext.Provider value={{ user, session, loading, userRole, isB2B, isRider, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};
