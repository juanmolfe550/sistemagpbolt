import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type AppRole = "admin" | "supervisor" | "operario" | "calidad" | "shi" | "sms" | "logistica" | "lider_proyecto";

type AuthState = {
  session: Session | null;
  loading: boolean;
  roles: AppRole[];
  isAdmin: boolean;
  canEdit: boolean;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [roles, setRoles] = useState<AppRole[]>([]);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
    });
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const uid = session?.user.id;
    if (!uid) {
      setRoles([]);
      return;
    }
    supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", uid)
      .then(({ data }) => setRoles((data ?? []).map((r) => r.role as AppRole)));
  }, [session?.user.id]);

  const isAdmin = roles.includes("admin");
  const canEdit = isAdmin || roles.includes("supervisor");

  return (
    <AuthContext.Provider
      value={{
        session,
        loading,
        roles,
        isAdmin,
        canEdit,
        signOut: async () => {
          await supabase.auth.signOut();
        },
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de AuthProvider");
  return ctx;
}

/** Rutas permitidas por rol. null = acceso total (admin/supervisor). */
export function rutasPermitidas(roles: AppRole[]): string[] | null {
  if (roles.includes("admin") || roles.includes("supervisor")) return null;
  const r = new Set<string>();
  if (roles.includes("lider_proyecto")) r.add("/proyectos");
  if (roles.includes("operario")) r.add("/taller");
  if (roles.includes("calidad")) r.add("/calidad");
  if (roles.includes("shi")) r.add("/shi");
  if (roles.includes("sms") || roles.includes("logistica")) r.add("/ordenes-trabajo");
  return [...r];
}
export function inicioDe(roles: AppRole[]): string {
  return rutasPermitidas(roles)?.[0] ?? "/panel";
}

export const ROLE_LABEL: Record<AppRole, string> = {
  admin: "Administrador",
  supervisor: "Supervisor",
  operario: "Operario",
  calidad: "Inspector de Calidad",
  shi: "Inspector de SHI",
  sms: "Inspector de SMS",
  logistica: "Logística",
  lider_proyecto: "Líder de Proyecto",
};
