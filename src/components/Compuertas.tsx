import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { BadgeCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { db, type Row } from "@/lib/data";
import { useAuth } from "@/lib/auth";
import { ESTADO_VERIF_LABEL, GERENCIAS_INSP, type EstadoVerif, type GerenciaInsp } from "@/lib/inspecciones";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export function useVerificaciones() {
  return useQuery({
    queryKey: ["rows", "verificaciones"],
    queryFn: async (): Promise<Row[]> => {
      const { data, error } = await db("verificaciones").select("*");
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function verifDe(rows: Row[], otId: number, g: GerenciaInsp): Row | undefined {
  return rows.find((v) => v.ot_id === otId && v.gerencia === g);
}

const tono: Record<EstadoVerif, string> = {
  pendiente: "bg-secondary text-muted-foreground border-border",
  revision: "bg-warning/30 text-warning-foreground border-warning",
  aprobada: "bg-success/20 text-success border-success",
  detenida: "bg-destructive/15 text-destructive border-destructive",
  no_aplica: "bg-muted text-muted-foreground border-dashed border-border line-through",
};

/** Barra de 4 compuertas (Logística, Calidad, SHI, SMS) de una OT. */
export function BarraCompuertas({ ot, verifs, compact, solo }: { ot: Row; verifs: Row[]; compact?: boolean; solo?: GerenciaInsp }) {
  const [abierta, setAbierta] = useState<GerenciaInsp | null>(null);
  return (
    <>
      <div className="flex gap-1">
        {GERENCIAS_INSP.filter((g) => !solo || g.key === solo).map((g) => {
          const v = verifDe(verifs, ot.id, g.key);
          const est = (v?.estado ?? "pendiente") as EstadoVerif;
          return (
            <button
              key={g.key}
              type="button"
              onClick={() => setAbierta(g.key)}
              title={`${g.label}: ${ESTADO_VERIF_LABEL[est]}${v?.firma_nombre ? ` — ${v.firma_nombre}` : ""}`}
              className={cn("rounded-sm border px-1.5 py-0.5 font-code text-[10px] font-semibold uppercase transition hover:ring-2 hover:ring-primary", tono[est], compact ? "" : "min-w-12")}
            >
              {compact ? g.label.slice(0, 3) : g.label}
            </button>
          );
        })}
      </div>
      {abierta && <VerificacionDialog ot={ot} gerencia={abierta} verif={verifDe(verifs, ot.id, abierta)} onClose={() => setAbierta(null)} />}
    </>
  );
}

export function SelloFirma({ v }: { v: Row }) {
  return (
    <div className="rounded border-2 border-success/60 bg-success/5 p-2 text-center text-xs">
      <div className="flex items-center justify-center gap-1 font-semibold text-success"><BadgeCheck className="h-3.5 w-3.5" /> APROBADO DIGITALMENTE</div>
      <div>{v.firma_nombre}{v.firma_cargo ? ` — ${v.firma_cargo}` : ""}</div>
      <div className="text-muted-foreground">{new Date(v.firma_fecha).toLocaleString("es-VE")}</div>
      <div className="font-code text-[11px]">Cód. verif: {v.firma_codigo}</div>
    </div>
  );
}

function VerificacionDialog({ ot, gerencia, verif, onClose }: { ot: Row; gerencia: GerenciaInsp; verif?: Row; onClose: () => void }) {
  const { roles, isAdmin } = useAuth();
  const qc = useQueryClient();
  const [obs, setObs] = useState("");
  const [sev, setSev] = useState("Mayor");
  const [busy, setBusy] = useState(false);
  const label = GERENCIAS_INSP.find((g) => g.key === gerencia)!.label;
  const puede = isAdmin || roles.includes(gerencia);
  const est = (verif?.estado ?? "pendiente") as EstadoVerif;
  const hist = useQuery({
    queryKey: ["rows", "verificaciones_historial", ot.id, gerencia],
    queryFn: async () => (await db("verificaciones_historial").select("*").eq("ot_id", ot.id).eq("gerencia", gerencia).order("fecha", { ascending: false })).data ?? [],
  });

  async function enviar(estado: EstadoVerif) {
    if (estado === "detenida" && !obs.trim()) { toast.error("Indica el motivo de la parada"); return; }
    setBusy(true);
    const { error } = await supabase.rpc("registrar_verificacion" as never, { _ot: ot.id, _gerencia: gerencia, _estado: estado, _obs: obs || null, _sev: estado === "detenida" ? sev : null } as never);
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success(`${label}: ${ESTADO_VERIF_LABEL[estado]}`);
    ["verificaciones", "verificaciones_historial", "ordenes_trabajo", "ordenes_produccion", "ot_bitacora"].forEach((t) => qc.invalidateQueries({ queryKey: ["rows", t] }));
    onClose();
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>Verificación {label} — OT {ot.numero}</DialogTitle></DialogHeader>
        <div className="space-y-3 text-sm">
          <div>Estado actual: <span className={cn("rounded-sm border px-1.5 py-0.5 text-xs font-semibold", tono[est])}>{ESTADO_VERIF_LABEL[est]}</span></div>
          {est === "aprobada" && verif && <SelloFirma v={verif} />}
          {verif?.observaciones && <p className="text-muted-foreground">Última observación: {verif.observaciones}</p>}
          {puede ? (
            <>
              <div className="space-y-1.5">
                <Label>Observaciones {est !== "detenida" && "(obligatorio para detener)"}</Label>
                <Textarea value={obs} onChange={(e) => setObs(e.target.value)} placeholder="Hallazgo, condición, acción correctiva…" />
              </div>
              {gerencia !== "logistica" && est !== "detenida" && (
                <div className="flex items-center gap-2">
                  <Label>Severidad si detiene:</Label>
                  <select className="h-8 rounded-md border border-input bg-card px-2" value={sev} onChange={(e) => setSev(e.target.value)}>
                    <option>Mayor</option><option>Crítica</option>
                  </select>
                </div>
              )}
            </>
          ) : (
            <p className="text-muted-foreground">Solo el inspector de {label} o Gestión de la Producción puede registrar esta verificación.</p>
          )}
          {(hist.data ?? []).length > 0 && (
            <div className="max-h-32 overflow-y-auto rounded border border-border p-2 text-xs">
              {(hist.data ?? []).map((h: Row) => (
                <div key={h.id}>{new Date(h.fecha).toLocaleString("es-VE")} · {h.usuario_nombre} · <b>{ESTADO_VERIF_LABEL[h.estado as EstadoVerif]}</b>{h.observaciones ? ` — ${h.observaciones}` : ""}</div>
              ))}
            </div>
          )}
        </div>
        {puede && (
          <DialogFooter className="flex-wrap gap-2">
            {est === "detenida" ? (
              <Button disabled={busy} onClick={() => enviar("revision")}>Levantar parada</Button>
            ) : (
              <>
                {isAdmin && <Button variant="ghost" disabled={busy} onClick={() => enviar("no_aplica")}>No aplica</Button>}
                <Button variant="outline" disabled={busy} onClick={() => enviar("revision")}>En revisión</Button>
                {gerencia !== "logistica" && <Button variant="destructive" disabled={busy} onClick={() => enviar("detenida")}>Detener OT</Button>}
                <Button disabled={busy} onClick={() => enviar("aprobada")}>Aprobar y firmar</Button>
              </>
            )}
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
