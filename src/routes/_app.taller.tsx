import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Play, ClipboardPen, OctagonAlert, CheckCheck, RotateCcw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { db, fmtDate, fmtNum, useInvalidate, useLookup, useRows, type Row } from "@/lib/data";
import { useAuth } from "@/lib/auth";
import { AvanceBar, PageHeader } from "@/components/ui-bits";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export const Route = createFileRoute("/_app/taller")({
  head: () => ({
    meta: [
      { title: "Ejecución en taller — Gestión de Producción" },
      { name: "description", content: "Tablero operativo de las líneas de producción: iniciar, avanzar, parar y terminar OT." },
      { property: "og:title", content: "Ejecución en taller" },
      { property: "og:description", content: "Tablero operativo de las líneas de producción." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Taller,
});

const COLS = [
  { key: "iniciar", title: "Por iniciar", hint: "Liberadas" },
  { key: "ejecucion", title: "En ejecución", hint: "Trabajando" },
  { key: "detenidas", title: "Detenidas / En espera", hint: "Material, ingeniería, inspección" },
  { key: "terminadas", title: "Terminadas", hint: "Esperan inspección final" },
] as const;
type ColKey = (typeof COLS)[number]["key"];

function columna(estado: string): ColKey | null {
  const s = estado.toLowerCase();
  if (s === "liberada") return "iniciar";
  if (s === "en ejecución") return "ejecucion";
  if (s === "terminada") return "terminadas";
  if (/espera|bloquead|detenid/.test(s)) return "detenidas";
  return null;
}

type Accion = { tipo: "avance" | "parada" | "terminado"; ot: Row } | null;

function Taller() {
  const { session, roles, isAdmin, canEdit } = useAuth();
  const puedeOperar = canEdit || roles.includes("operario");
  const { data: ots = [] } = useRows("ordenes_trabajo", "fecha_inicio_plan");
  const ops = useLookup("ordenes_produccion");
  const ger = useLookup("gerencias");
  const estados = useLookup("estados_ot");
  const invalidate = useInvalidate();
  const [gerencia, setGerencia] = useState<string>("");
  const [accion, setAccion] = useState<Accion>(null);

  const perfil = useQuery({
    queryKey: ["perfil", session?.user.id],
    enabled: !!session,
    queryFn: async () => (await supabase.from("profiles").select("gerencia_id").eq("id", session!.user.id).maybeSingle()).data,
  });
  const lineaFija = !isAdmin && !canEdit && perfil.data?.gerencia_id ? String(perfil.data.gerencia_id) : "";
  useEffect(() => {
    if (perfil.data?.gerencia_id && !gerencia) setGerencia(String(perfil.data.gerencia_id));
  }, [perfil.data]); // eslint-disable-line react-hooks/exhaustive-deps
  const filtro = lineaFija || gerencia;

  const visibles = ots.filter((o) => !filtro || String(o.gerencia_id) === filtro);
  const porCol = (k: ColKey) => visibles.filter((o) => columna(estados.label(o.estado_id)) === k);

  async function cambiarEstado(ot: Row, nombre: string, extra: Record<string, unknown>, bit: { tipo: string; nota?: string; piezas?: number; hh?: number }) {
    const id = estados.rows.find((e) => e.nombre.toLowerCase() === nombre.toLowerCase())?.id;
    if (!id) { toast.error(`No existe el estado "${nombre}" en el catálogo`); return; }
    const { error } = await db("ordenes_trabajo").update({ estado_id: id, ...extra }).eq("id", ot.id);
    if (error) { toast.error(error.message); return; }
    await registrar(ot, bit);
    toast.success(`${ot.numero}: ${nombre}`);
  }

  async function registrar(ot: Row, bit: { tipo: string; nota?: string; piezas?: number; hh?: number }) {
    const { error } = await db("ot_bitacora").insert({ ot_id: ot.id, usuario_id: session!.user.id, ...bit });
    if (error) toast.error(error.message);
    invalidate("ordenes_trabajo");
  }

  const hoy = new Date().toISOString().slice(0, 10);

  return (
    <div>
      <PageHeader title="Tablero de ejecución" code="Taller / Líneas de producción">
        <select
          className="h-9 rounded-md border border-input bg-card px-2 text-sm"
          value={filtro}
          disabled={!!lineaFija}
          onChange={(e) => setGerencia(e.target.value)}
        >
          <option value="">Toda la planta</option>
          {ger.rows.map((g) => <option key={g.id} value={g.id}>{g.nombre}</option>)}
        </select>
      </PageHeader>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {COLS.map((c) => {
          const items = porCol(c.key);
          return (
            <section key={c.key} className="flex flex-col rounded-lg border border-border bg-muted/40">
              <header className="flex items-baseline justify-between border-b border-border px-3 py-2">
                <div>
                  <h2 className="text-sm font-semibold">{c.title}</h2>
                  <p className="text-[11px] text-muted-foreground">{c.hint}</p>
                </div>
                <span className="font-code text-lg font-semibold tabular-nums">{items.length}</span>
              </header>
              <div className="flex flex-col gap-2 p-2">
                {items.length === 0 && <p className="p-3 text-center text-xs text-muted-foreground">Sin órdenes</p>}
                {items.map((o) => {
                  const est = estados.label(o.estado_id);
                  return (
                    <article key={o.id} className="rounded-md border border-border bg-card p-3 text-sm shadow-sm">
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-code font-semibold">{o.numero}</span>
                        <span className="text-[11px] text-muted-foreground">OP {ops.label(o.op_id)}</span>
                      </div>
                      <div className="mt-0.5 line-clamp-2 text-muted-foreground">{o.objeto ?? o.descripcion ?? "—"}</div>
                      {!filtro && <div className="mt-1 text-[11px] text-muted-foreground">{ger.label(o.gerencia_id)}</div>}
                      <div className="mt-2 flex items-center justify-between">
                        <AvanceBar value={o.avance} />
                        <span className="font-code text-[11px] tabular-nums text-muted-foreground">
                          {fmtNum(o.cantidad_ejecutada, 2)}/{fmtNum(o.cantidad, 2)} {o.unidad_medida ?? ""}
                        </span>
                      </div>
                      <div className="mt-1 font-code text-[11px] text-muted-foreground">
                        HH {fmtNum(o.hh_ejecutadas, 1)}/{fmtNum(o.hh_planificadas, 1)} · Fin plan {fmtDate(o.fecha_fin_plan)}
                      </div>
                      {c.key === "detenidas" && <div className="mt-1 text-xs font-medium text-destructive">{est}</div>}
                      {puedeOperar && (
                        <div className="mt-3 flex flex-wrap gap-1.5">
                          {c.key === "iniciar" && (
                            <Button size="sm" onClick={() => cambiarEstado(o, "En ejecución", { fecha_inicio_real: o.fecha_inicio_real ?? hoy }, { tipo: "inicio" })}>
                              <Play className="h-3.5 w-3.5" /> Iniciar trabajo
                            </Button>
                          )}
                          {c.key === "ejecucion" && (
                            <>
                              <Button size="sm" onClick={() => setAccion({ tipo: "avance", ot: o })}>
                                <ClipboardPen className="h-3.5 w-3.5" /> Avance y HH
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => setAccion({ tipo: "parada", ot: o })}>
                                <OctagonAlert className="h-3.5 w-3.5" /> Parada
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => setAccion({ tipo: "terminado", ot: o })}>
                                <CheckCheck className="h-3.5 w-3.5" /> Terminar
                              </Button>
                            </>
                          )}
                          {c.key === "detenidas" && est !== "En espera/Bloqueada" && !/detenid/i.test(est) && (
                            <Button size="sm" variant="outline" onClick={() => cambiarEstado(o, "En ejecución", {}, { tipo: "reanudacion", nota: "Incidencia resuelta" })}>
                              <RotateCcw className="h-3.5 w-3.5" /> Reanudar
                            </Button>
                          )}
                        </div>
                      )}
                    </article>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>

      <AccionDialog
        accion={accion}
        onClose={() => setAccion(null)}
        onAvance={async (ot, piezas, hh, nota) => { await registrar(ot, { tipo: "avance", piezas, hh, nota }); toast.success("Avance registrado"); }}
        onParada={(ot, estado, nota) => cambiarEstado(ot, estado, {}, { tipo: "parada", nota })}
        onTerminado={async (ot, piezas, hh, nota) => {
          await cambiarEstado(ot, "Terminada", { fecha_fin_real: hoy }, { tipo: "terminado", piezas, hh, nota });
        }}
      />
    </div>
  );
}

function AccionDialog({
  accion, onClose, onAvance, onParada, onTerminado,
}: {
  accion: Accion;
  onClose: () => void;
  onAvance: (ot: Row, piezas: number, hh: number, nota: string) => Promise<void>;
  onParada: (ot: Row, estado: string, nota: string) => Promise<unknown>;
  onTerminado: (ot: Row, piezas: number, hh: number, nota: string) => Promise<void>;
}) {
  const [piezas, setPiezas] = useState("");
  const [hh, setHh] = useState("");
  const [nota, setNota] = useState("");
  const [motivo, setMotivo] = useState("En espera de material");
  const [busy, setBusy] = useState(false);
  useEffect(() => { setPiezas(""); setHh(""); setNota(""); }, [accion]);
  if (!accion) return null;
  const { ot, tipo } = accion;
  const titulo = tipo === "avance" ? "Declarar avance y horas" : tipo === "parada" ? "Reportar parada" : "Declarar trabajo terminado";

  async function guardar() {
    const p = Number(piezas || 0), h = Number(hh || 0);
    if (p < 0 || h < 0) { toast.error("Los valores no pueden ser negativos"); return; }
    if (tipo === "avance" && p === 0 && h === 0) { toast.error("Indica piezas o horas"); return; }
    if (tipo === "parada" && !nota.trim()) { toast.error("Describe el motivo de la parada"); return; }
    setBusy(true);
    if (tipo === "avance") await onAvance(ot, p, h, nota);
    else if (tipo === "parada") await onParada(ot, motivo, nota);
    else await onTerminado(ot, p, h, nota);
    setBusy(false);
    onClose();
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader><DialogTitle>{titulo} — {ot.numero}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          {tipo === "parada" ? (
            <div className="space-y-1.5">
              <Label>Motivo</Label>
              <select className="h-9 w-full rounded-md border border-input bg-card px-2 text-sm" value={motivo} onChange={(e) => setMotivo(e.target.value)}>
                <option>En espera de material</option>
                <option value="Bloqueada por Ingenieria">Bloqueada por Ingeniería</option>
              </select>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Piezas hechas {tipo === "terminado" ? "(restantes)" : "hoy"}</Label>
                <Input type="number" min={0} step="any" value={piezas} onChange={(e) => setPiezas(e.target.value)} />
                <p className="text-[11px] text-muted-foreground">Llevas {fmtNum(ot.cantidad_ejecutada, 2)} de {fmtNum(ot.cantidad, 2)}</p>
              </div>
              <div className="space-y-1.5">
                <Label>Horas hombre (HH)</Label>
                <Input type="number" min={0} step="any" value={hh} onChange={(e) => setHh(e.target.value)} />
              </div>
            </div>
          )}
          <div className="space-y-1.5">
            <Label>{tipo === "parada" ? "Detalle (obligatorio)" : "Nota (opcional)"}</Label>
            <Textarea value={nota} onChange={(e) => setNota(e.target.value)} placeholder={tipo === "parada" ? "Ej. Falta material SAE 4140" : ""} />
          </div>
          {tipo === "terminado" && <p className="text-xs text-muted-foreground">La OT pasará a Terminada y quedará lista para la inspección final de las gerencias.</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={guardar} disabled={busy}>Guardar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
