import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, ROLE_LABEL, type AppRole } from "@/lib/auth";
import { PageHeader } from "@/components/ui-bits";
import { useLookup } from "@/lib/data";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export const Route = createFileRoute("/_app/usuarios")({
  head: () => ({
    meta: [
      { title: "Usuarios y roles — Gestión de Producción" },
      { name: "description", content: "Asignación de roles a los usuarios del sistema." },
      { property: "og:title", content: "Usuarios y roles" },
      { property: "og:description", content: "Asignación de roles a los usuarios del sistema." },
    ],
  }),
  component: Usuarios,
});

function Usuarios() {
  const { isAdmin, session } = useAuth();
  const qc = useQueryClient();
  const ger = useLookup("gerencias");
  const emp = useLookup("empleados");
  const { data = [] } = useQuery({
    queryKey: ["usuarios"],
    enabled: isAdmin,
    queryFn: async () => {
      const [p, r] = await Promise.all([supabase.from("profiles").select("*").order("created_at"), supabase.from("user_roles").select("*")]);
      return (p.data ?? []).map((u) => ({ ...u, role: (r.data ?? []).find((x) => x.user_id === u.id)?.role as AppRole | undefined }));
    },
  });

  async function setRole(userId: string, role: AppRole) {
    const del = await supabase.from("user_roles").delete().eq("user_id", userId);
    const ins = await supabase.from("user_roles").insert({ user_id: userId, role });
    if (del.error || ins.error) toast.error("No se pudo cambiar el rol");
    else toast.success("Rol actualizado");
    qc.invalidateQueries({ queryKey: ["usuarios"] });
  }

  async function setGerencia(userId: string, gerencia_id: number | null) {
    const { error } = await supabase.from("profiles").update({ gerencia_id }).eq("id", userId);
    if (error) toast.error("No se pudo asignar la línea");
    else toast.success("Línea de producción asignada");
    qc.invalidateQueries({ queryKey: ["usuarios"] });
  }

  async function setEmpleado(userId: string, empleado_id: number | null) {
    const { error } = await supabase.from("profiles").update({ empleado_id }).eq("id", userId);
    if (error) toast.error("No se pudo vincular el empleado");
    else toast.success("Empleado vinculado");
    qc.invalidateQueries({ queryKey: ["usuarios"] });
  }

  if (!isAdmin) return <div className="text-muted-foreground">Solo el administrador puede ver esta sección.</div>;

  return (
    <div>
      <PageHeader title="Usuarios y roles" code="Administración" />
      <p className="mb-4 max-w-2xl text-sm text-muted-foreground">
        Los nuevos usuarios se registran desde la pantalla de ingreso y entran como Operario. Aquí puedes cambiarles el rol.
      </p>
      <div className="rounded-lg border border-border bg-card">
        <Table>
          <TableHeader><TableRow><TableHead>Nombre</TableHead><TableHead>Correo</TableHead><TableHead>Rol</TableHead><TableHead>Línea de producción (Taller)</TableHead><TableHead>Empleado (Líder de Proyecto)</TableHead></TableRow></TableHeader>
          <TableBody>
            {data.map((u) => (
              <TableRow key={u.id}>
                <TableCell>{u.nombre}</TableCell>
                <TableCell>{u.email}</TableCell>
                <TableCell>
                  <select
                    className="h-9 rounded-md border border-input bg-card px-2 text-sm"
                    value={u.role ?? ""}
                    disabled={u.id === session?.user.id}
                    onChange={(e) => setRole(u.id, e.target.value as AppRole)}
                  >
                    {(Object.keys(ROLE_LABEL) as AppRole[]).map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
                  </select>
                </TableCell>
                <TableCell>
                  <select
                    className="h-9 rounded-md border border-input bg-card px-2 text-sm"
                    value={u.gerencia_id ?? ""}
                    onChange={(e) => setGerencia(u.id, e.target.value ? Number(e.target.value) : null)}
                  >
                    <option value="">— Todas —</option>
                    {ger.rows.map((g) => <option key={g.id} value={g.id}>{g.nombre}</option>)}
                  </select>
                </TableCell>
                <TableCell>
                  <select
                    className="h-9 rounded-md border border-input bg-card px-2 text-sm"
                    value={u.empleado_id ?? ""}
                    onChange={(e) => setEmpleado(u.id, e.target.value ? Number(e.target.value) : null)}
                  >
                    <option value="">— Sin vincular —</option>
                    {emp.rows.map((g) => <option key={g.id} value={g.id}>{g.nombre_completo}</option>)}
                  </select>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
