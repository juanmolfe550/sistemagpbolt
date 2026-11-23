import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Factory } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Ingresar — Gestión de Producción" },
      { name: "description", content: "Acceso al sistema de gestión de producción." },
      { property: "og:title", content: "Ingresar — Gestión de Producción" },
      { property: "og:description", content: "Acceso al sistema de gestión de producción." },
    ],
  }),
  component: Login,
});

function Login() {
  const { session } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nombre, setNombre] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (session) navigate({ to: "/panel", replace: true });
  }, [session, navigate]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    if (mode === "in") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) toast.error("Correo o contraseña incorrectos");
    } else {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: window.location.origin, data: { nombre } },
      });
      if (error) toast.error(error.message);
      else toast.success("Revisa tu correo para confirmar la cuenta");
    }
    setBusy(false);
  }

  async function google() {
    const r = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    if (r.error) toast.error("No se pudo ingresar con Google");
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden flex-col justify-between bg-sidebar p-10 text-sidebar-foreground lg:flex">
        <div className="flex items-center gap-2 text-sidebar-accent-foreground">
          <Factory className="h-6 w-6 text-sidebar-primary" />
          <span className="font-semibold">Gestión de Producción</span>
        </div>
        <div>
          <div className="font-code text-xs uppercase tracking-[0.3em] text-sidebar-primary">OP → OT</div>
          <h2 className="mt-3 max-w-md text-4xl font-semibold leading-tight text-sidebar-accent-foreground">
            Cada orden de producción, con todas sus órdenes de trabajo a la vista.
          </h2>
        </div>
        <div className="hazard-stripe absolute inset-x-0 bottom-0 h-2" />
      </div>
      <div className="flex items-center justify-center p-6">
        <form onSubmit={submit} className="w-full max-w-sm space-y-4">
          <h1 className="text-2xl font-semibold">{mode === "in" ? "Ingresar" : "Crear cuenta"}</h1>
          {mode === "up" && (
            <div className="space-y-1.5">
              <Label>Nombre</Label>
              <Input value={nombre} onChange={(e) => setNombre(e.target.value)} required />
            </div>
          )}
          <div className="space-y-1.5">
            <Label>Correo</Label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="space-y-1.5">
            <Label>Contraseña</Label>
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
          </div>
          <Button type="submit" className="w-full" disabled={busy}>
            {mode === "in" ? "Ingresar" : "Registrarme"}
          </Button>
          <Button type="button" variant="outline" className="w-full" onClick={google}>
            Continuar con Google
          </Button>
          <button type="button" className="w-full text-sm text-muted-foreground hover:text-foreground" onClick={() => setMode(mode === "in" ? "up" : "in")}>
            {mode === "in" ? "¿No tienes cuenta? Regístrate" : "¿Ya tienes cuenta? Ingresa"}
          </button>
        </form>
      </div>
    </div>
  );
}
