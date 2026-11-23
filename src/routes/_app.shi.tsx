/* eslint-disable @typescript-eslint/no-explicit-any */
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { db, useLookup, useRows, type Row } from "@/lib/data";
import { useAuth } from "@/lib/auth";
import { SHI_DOCS, type ShiTipo } from "@/lib/inspecciones";
import { BarraCompuertas, useVerificaciones } from "@/components/Compuertas";
import { EstadoBadge, PageHeader } from "@/components/ui-bits";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/shi")({
  head: () => ({
    meta: [
      { title: "Seguridad e Higiene Industrial — Sistema de Producción" },
      { name: "description", content: "ATS digital y permisos de trabajo especiales por orden de trabajo." },
      { property: "og:title", content: "Módulo SHI" },
      { property: "og:description", content: "ATS y permisos de trabajo por OT." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Shi,
});

const ACTIVOS = ["Liberada", "En ejecución", "Terminada"];

function Shi() {
  const { roles, isAdmin, canEdit } = useAuth();
  const puede = isAdmin || roles.includes("shi");
  const ots = useRows("ordenes_trabajo", "numero");
  const docs = useRows("shi_documentos");
  const estados = useLookup("estados_ot");
  const verifs = useVerificaciones();
  const qc = useQueryClient();
  const [tab, setTab] = useState<"proceso" | "liberar">("proceso");
  const [abierto, setAbierto] = useState<{ ot: Row; tipo: ShiTipo } | null>(null);

  const lista = (ots.data ?? []).filter((o) => {
    const e = estados.map.get(o.estado_id) ?? "";
    return tab === "liberar" ? e === "Terminada" : ACTIVOS.includes(e) && e !== "Terminada" || e.startsWith("Detenida");
  });
  const doc = (otId: number, t: ShiTipo) => (docs.data ?? []).find((d) => d.ot_id === otId && d.tipo === t);

  async function marcarAts(ot: Row, v: boolean) {
    const { error } = await db("ordenes_trabajo").update({ requiere_ats: v }).eq("id", ot.id);
    if (error) { toast.error(error.message); return; }
    qc.invalidateQueries({ queryKey: ["rows", "ordenes_trabajo"] });
  }

  return (
    <div>
      <PageHeader title="Seguridad e Higiene Industrial" code="MÓDULO SHI" />
      <div className="mb-4 flex gap-2">
        <Button variant={tab === "proceso" ? "default" : "outline"} onClick={() => setTab("proceso")}>En proceso</Button>
        <Button variant={tab === "liberar" ? "default" : "outline"} onClick={() => setTab("liberar")}>Por liberar (terminadas)</Button>
      </div>
      <div className="space-y-2">
        {lista.length === 0 && <p className="text-sm text-muted-foreground">No hay órdenes de trabajo en esta bandeja.</p>}
        {lista.map((o) => (
          <div key={o.id} className="rounded-md border border-border bg-card p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="font-code font-semibold">{o.numero}</span>
                <span className="text-sm">{o.objeto ?? ""}</span>
                <EstadoBadge nombre={estados.map.get(o.estado_id)} />
              </div>
              <BarraCompuertas ot={o} verifs={verifs.data ?? []} solo="shi" />
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
              <label className="flex items-center gap-1">
                <input type="checkbox" checked={!!o.requiere_ats} disabled={!(canEdit || puede)} onChange={(e) => marcarAts(o, e.target.checked)} />
                Requiere ATS / permisos (bloquea inicio sin ATS aprobado)
              </label>
              {SHI_DOCS.map((d) => {
                const r = doc(o.id, d.tipo);
                return (
                  <button key={d.tipo} type="button" onClick={() => setAbierto({ ot: o, tipo: d.tipo })}
                    className={cn("rounded-sm border px-2 py-0.5 font-code transition hover:ring-2 hover:ring-primary",
                      r?.estado === "aprobado" ? "border-success bg-success/20 text-success" : r ? "border-warning bg-warning/30" : "border-border bg-secondary text-muted-foreground")}>
                    {d.codigo}{r?.estado === "aprobado" ? " ✓" : r ? " (borrador)" : ""}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      {abierto && <DocDialog ot={abierto.ot} tipo={abierto.tipo} doc={doc(abierto.ot.id, abierto.tipo)} puede={puede} onClose={() => setAbierto(null)} />}
    </div>
  );
}

function DocDialog({ ot, tipo, doc, puede, onClose }: { ot: Row; tipo: ShiTipo; doc?: Row; puede: boolean; onClose: () => void }) {
  const def = SHI_DOCS.find((d) => d.tipo === tipo)!;
  const qc = useQueryClient();
  const [datos, setDatos] = useState<Record<string, any>>(doc?.datos ?? {});
  const checks = (datos["checks"] as boolean[]) ?? [];
  const aprobado = doc?.estado === "aprobado";
  const set = (k: string, v: unknown) => setDatos((d) => ({ ...d, [k]: v }));

  async function guardar(estado: string) {
    if (estado === "aprobado" && def.checks.some((_, i) => !checks[i])) { toast.error("Todas las verificaciones deben estar marcadas para aprobar."); return; }
    const { error } = await db("shi_documentos").upsert({ ot_id: ot.id, tipo, datos, estado }, { onConflict: "ot_id,tipo" });
    if (error) { toast.error(error.message); return; }
    toast.success(estado === "aprobado" ? "Aprobado y firmado" : "Guardado");
    qc.invalidateQueries({ queryKey: ["rows", "shi_documentos"] });
    onClose();
  }

  const ro = !puede || aprobado;
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-xl overflow-y-auto">
        <DialogHeader><DialogTitle>{def.titulo} ({def.codigo}) — OT {ot.numero}</DialogTitle></DialogHeader>
        <div className="space-y-3 text-sm">
          <div className="space-y-1">
            {def.checks.map((c, i) => (
              <label key={i} className="flex items-start gap-2">
                <input type="checkbox" disabled={ro} checked={!!checks[i]} onChange={(e) => { const n = [...checks]; n[i] = e.target.checked; set("checks", n); }} />
                {c}
              </label>
            ))}
          </div>
          <div><div className="mb-1 text-xs font-medium">Pasos / peligros / controles</div>
            <Textarea disabled={ro} value={(datos["pasos"] as string) ?? ""} onChange={(e) => set("pasos", e.target.value)} /></div>
          <div><div className="mb-1 text-xs font-medium">Trabajadores (nombre, cédula, cargo — uno por línea)</div>
            <Textarea disabled={ro} value={(datos["trabajadores"] as string) ?? ""} onChange={(e) => set("trabajadores", e.target.value)} /></div>
          {aprobado && (
            <div className="rounded border-2 border-success/60 bg-success/5 p-2 text-center text-xs">
              <div className="font-semibold text-success">APROBADO DIGITALMENTE</div>
              <div>{doc.firma_nombre}{doc.firma_cargo ? ` — ${doc.firma_cargo}` : ""}</div>
              <div className="text-muted-foreground">{new Date(doc.firma_fecha).toLocaleString("es-VE")}</div>
              <div className="font-code">Cód. verif: {doc.firma_codigo}</div>
            </div>
          )}
          {!puede && <p className="text-muted-foreground">Solo el inspector de SHI o Gestión de la Producción puede llenar este formato.</p>}
        </div>
        {puede && (
          <DialogFooter className="gap-2">
            {aprobado ? (
              <Button variant="outline" onClick={() => guardar("borrador")}>Reabrir (quita la firma)</Button>
            ) : (
              <>
                <Button variant="outline" onClick={() => guardar("borrador")}>Guardar borrador</Button>
                <Button onClick={() => guardar("aprobado")}>Aprobar y firmar</Button>
              </>
            )}
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
