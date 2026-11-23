import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Lock, Plus, Send, Unlock, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { db, fmtDate, fmtNum, useInvalidate, useLookup, useRows, type Row } from "@/lib/data";
import { PageHeader } from "@/components/ui-bits";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export const Route = createFileRoute("/_app/proyectos")({
  head: () => ({
    meta: [
      { title: "Líder de Proyecto — Gestión de Producción" },
      { name: "description", content: "Planificación de órdenes de trabajo por el líder de proyecto." },
      { property: "og:title", content: "Líder de Proyecto" },
      { property: "og:description", content: "Planificación de órdenes de trabajo por el líder de proyecto." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Proyectos,
});

type Form = { numero: string; objeto: string; descripcion: string; gerencia_id: string; cantidad: string; hh_planificadas: string; fecha_inicio_plan: string; fecha_fin_plan: string; justificacion_no_programada: string };
const vacio: Form = { numero: "", objeto: "", descripcion: "", gerencia_id: "", cantidad: "1", hh_planificadas: "0", fecha_inicio_plan: "", fecha_fin_plan: "", justificacion_no_programada: "" };

function Proyectos() {
  const { session, canEdit } = useAuth();
  const ops = useRows("ordenes_produccion", "id", false);
  const ots = useRows("ordenes_trabajo");
  const estOp = useLookup("estados_op");
  const estOt = useLookup("estados_ot");
  const ger = useLookup("gerencias");
  const cli = useLookup("clientes");
  const inv = useInvalidate();
  const [sel, setSel] = useState<number | null>(null);
  const [dlg, setDlg] = useState<{ op: Row; noProg: boolean } | null>(null);
  const [f, setF] = useState<Form>(vacio);

  const perfil = useQuery({
    queryKey: ["mi-perfil", session?.user.id],
    enabled: !!session,
    queryFn: async () => (await supabase.from("profiles").select("empleado_id").eq("id", session!.user.id).single()).data,
  });
  const miEmp = perfil.data?.empleado_id ?? null;
  const misOps = (ops.data ?? []).filter((o) => canEdit || (miEmp && o.responsable_id === miEmp));
  const op = misOps.find((o) => o.id === sel) ?? null;
  const hijas = (ots.data ?? []).filter((o) => o.op_id === op?.id);

  async function guardarOT() {
    if (!dlg || !f.numero.trim()) { toast.error("Indique el número de la OT"); return; }
    if (dlg.noProg && !f.justificacion_no_programada.trim()) { toast.error("Indique la justificación"); return; }
    const { error } = await db("ordenes_trabajo").insert({
      op_id: dlg.op.id, numero: f.numero.trim(), objeto: f.objeto || null, descripcion: f.descripcion || null,
      gerencia_id: f.gerencia_id ? Number(f.gerencia_id) : null, cantidad: Number(f.cantidad) || 1,
      hh_planificadas: Number(f.hh_planificadas) || 0, fecha_inicio_plan: f.fecha_inicio_plan || null,
      fecha_fin_plan: f.fecha_fin_plan || null, fecha_elaboracion: new Date().toISOString().slice(0, 10),
      no_programada: dlg.noProg, justificacion_no_programada: dlg.noProg ? f.justificacion_no_programada : null,
    });
    if (error) { toast.error(error.message); return; }
    toast.success(dlg.noProg ? "Solicitud enviada a Gestión de la Producción" : "OT planificada");
    setDlg(null); setF(vacio); inv("ordenes_trabajo");
  }

  async function borrarOT(id: number) {
    const { error } = await db("ordenes_trabajo").delete().eq("id", id);
    if (error) toast.error(error.message); else inv("ordenes_trabajo");
  }

  async function someter() {
    if (!op || !confirm("Al someter, la planificación queda firmada y bloqueada. ¿Continuar?")) return;
    const { data, error } = await supabase.rpc("someter_planificacion", { _op: op.id });
    if (error) { toast.error(error.message); return; }
    toast.success(`Planificación firmada: ${data}`); inv("ordenes_produccion");
  }

  async function reabrir() {
    if (!op) return;
    const { error } = await supabase.rpc("reabrir_planificacion", { _op: op.id });
    if (error) toast.error(error.message); else { toast.success("Planificación reabierta"); inv("ordenes_produccion"); }
  }

  const set = (k: keyof Form) => (e: { target: { value: string } }) => setF({ ...f, [k]: e.target.value });

  return (
    <div>
      <PageHeader title="Mis proyectos" code="Líder de Proyecto" />
      {!canEdit && !miEmp && !perfil.isLoading && (
        <p className="mb-4 rounded-md border border-border bg-card p-3 text-sm text-muted-foreground">
          Su usuario aún no está vinculado a un empleado. Pida al administrador que lo vincule en Usuarios.
        </p>
      )}
      <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
        <div className="space-y-2">
          {misOps.length === 0 && <p className="text-sm text-muted-foreground">No tiene órdenes de producción asignadas.</p>}
          {misOps.map((o) => (
            <button key={o.id} onClick={() => setSel(o.id)}
              className={`w-full rounded-lg border p-3 text-left transition-colors ${sel === o.id ? "border-primary bg-accent" : "border-border bg-card hover:bg-accent"}`}>
              <div className="flex items-center justify-between font-mono text-sm font-semibold">
                {o.numero} {o.plan_congelada && <Lock className="h-3.5 w-3.5 text-primary" />}
              </div>
              <div className="text-sm">{o.producto}</div>
              <div className="text-xs text-muted-foreground">{cli.label(o.cliente_id)} · {estOp.label(o.estado_id)} · {fmtNum(o.avance)}%</div>
            </button>
          ))}
        </div>

        {op ? (
          <div className="space-y-4">
            <div className="rounded-lg border border-border bg-card p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <div className="font-mono text-lg font-semibold">{op.numero}</div>
                  <div className="text-sm text-muted-foreground">{op.producto} · Compromiso {fmtDate(op.fecha_compromiso)}</div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {!op.plan_congelada && (
                    <>
                      <Button size="sm" variant="outline" onClick={() => { setF(vacio); setDlg({ op, noProg: false }); }}><Plus className="mr-1 h-4 w-4" />Planificar OT</Button>
                      <Button size="sm" onClick={someter}><Send className="mr-1 h-4 w-4" />Someter planificación</Button>
                    </>
                  )}
                  {op.plan_congelada && (
                    <Button size="sm" variant="outline" onClick={() => { setF(vacio); setDlg({ op, noProg: true }); }}><AlertTriangle className="mr-1 h-4 w-4" />Solicitar OT no programada</Button>
                  )}
                  {op.plan_congelada && canEdit && (
                    <Button size="sm" variant="ghost" onClick={reabrir}><Unlock className="mr-1 h-4 w-4" />Reabrir (Gestión)</Button>
                  )}
                </div>
              </div>
              {op.plan_congelada && (
                <div className="mt-3 rounded-md border border-primary/40 bg-accent p-3 text-xs">
                  <div className="font-semibold uppercase tracking-wide text-primary">Planificación firmada digitalmente</div>
                  <div>{op.plan_firma_nombre} {op.plan_firma_cargo ? `— ${op.plan_firma_cargo}` : ""}</div>
                  <div>{op.plan_firma_fecha ? new Date(op.plan_firma_fecha).toLocaleString("es-VE") : ""}</div>
                  <div className="font-mono">{op.plan_firma_codigo}</div>
                  <div className="mt-1 text-muted-foreground">Plan bloqueado. Cualquier cambio debe solicitarse a Gestión de la Producción.</div>
                </div>
              )}
            </div>

            <div className="overflow-x-auto rounded-lg border border-border bg-card">
              <table className="w-full text-sm">
                <thead className="bg-muted text-left text-xs uppercase text-muted-foreground">
                  <tr><th className="p-2">OT</th><th className="p-2">Objeto</th><th className="p-2">Línea</th><th className="p-2">HH plan.</th><th className="p-2">Inicio</th><th className="p-2">Fin</th><th className="p-2">Estado</th><th className="p-2">Avance</th><th /></tr>
                </thead>
                <tbody>
                  {hijas.length === 0 && <tr><td colSpan={9} className="p-4 text-center text-muted-foreground">Sin OT planificadas.</td></tr>}
                  {hijas.map((o) => (
                    <tr key={o.id} className="border-t border-border">
                      <td className="p-2 font-mono">{o.numero}{o.no_programada && <span className="ml-1 rounded bg-accent px-1 text-[10px] text-primary">NO PROG.</span>}</td>
                      <td className="p-2">{o.objeto ?? o.descripcion ?? "—"}</td>
                      <td className="p-2">{ger.label(o.gerencia_id)}</td>
                      <td className="p-2">{fmtNum(o.hh_planificadas, 1)}</td>
                      <td className="p-2">{fmtDate(o.fecha_inicio_plan)}</td>
                      <td className="p-2">{fmtDate(o.fecha_fin_plan)}</td>
                      <td className="p-2">{estOt.label(o.estado_id)}</td>
                      <td className="p-2">{fmtNum(o.avance)}%</td>
                      <td className="p-2">{!op.plan_congelada && <Button size="sm" variant="ghost" onClick={() => borrarOT(o.id)}>Quitar</Button>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Seleccione una orden de producción.</p>
        )}
      </div>

      <Dialog open={!!dlg} onOpenChange={(o) => !o && setDlg(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{dlg?.noProg ? "Solicitar OT no programada" : "Planificar OT"} — {dlg?.op.numero}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <label className="col-span-2">N° de OT<Input value={f.numero} onChange={set("numero")} /></label>
            <label className="col-span-2">Objeto<Input value={f.objeto} onChange={set("objeto")} /></label>
            <label className="col-span-2">Descripción<Textarea value={f.descripcion} onChange={set("descripcion")} /></label>
            <label className="col-span-2">Línea propuesta
              <select className="h-9 w-full rounded-md border border-input bg-card px-2" value={f.gerencia_id} onChange={set("gerencia_id")}>
                <option value="">—</option>
                {ger.rows.map((g) => <option key={g.id} value={g.id}>{g.nombre}</option>)}
              </select>
            </label>
            <label>Cantidad<Input type="number" value={f.cantidad} onChange={set("cantidad")} /></label>
            <label>HH planificadas<Input type="number" value={f.hh_planificadas} onChange={set("hh_planificadas")} /></label>
            <label>Inicio planificado<Input type="date" value={f.fecha_inicio_plan} onChange={set("fecha_inicio_plan")} /></label>
            <label>Fin planificado<Input type="date" value={f.fecha_fin_plan} onChange={set("fecha_fin_plan")} /></label>
            {dlg?.noProg && <label className="col-span-2">Justificación<Textarea value={f.justificacion_no_programada} onChange={set("justificacion_no_programada")} /></label>}
          </div>
          <p className="text-xs text-muted-foreground">La OT nace en estado Creada. Solo Gestión de la Producción la libera.</p>
          <DialogFooter><Button onClick={guardarOT}>Guardar</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
