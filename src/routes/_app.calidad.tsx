import { createFileRoute } from "@tanstack/react-router";
import { Fragment, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ChevronDown, ChevronRight, Plus, Trash2 } from "lucide-react";
import { BarraCompuertas, useVerificaciones } from "@/components/Compuertas";
import { db, useLookup, useRows, type Row } from "@/lib/data";
import { useAuth } from "@/lib/auth";
import { CALIDAD_ITEMS, CONFORMIDADES, consolidar } from "@/lib/inspecciones";
import { PageHeader } from "@/components/ui-bits";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/calidad")({
  head: () => ({
    meta: [
      { title: "Gestión de la Calidad — Sistema de Producción" },
      { name: "description", content: "Tablero de calidad EANSA de 16 ítems por orden de producción y de trabajo." },
      { property: "og:title", content: "Gestión de la Calidad" },
      { property: "og:description", content: "Tablero de calidad EANSA por OP y OT." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Calidad,
});

const tono: Record<string, string> = {
  Conforme: "bg-success/20 text-success",
  "No conforme": "bg-destructive/15 text-destructive",
  "En evaluación": "bg-warning/30 text-warning-foreground",
  Pendiente: "bg-secondary text-muted-foreground",
  "No aplica": "bg-muted text-muted-foreground line-through",
};

function Calidad() {
  const { roles, isAdmin } = useAuth();
  const puede = isAdmin || roles.includes("calidad");
  const ops = useRows("ordenes_produccion", "numero");
  const ots = useRows("ordenes_trabajo", "numero");
  const [tipo, setTipo] = useState<"op" | "ot">("op");
  const [ordenId, setOrdenId] = useState<number | null>(null);
  const [abierto, setAbierto] = useState<number | null>(null);
  const qc = useQueryClient();
  const verifs = useVerificaciones();
  const key = ["rows", "calidad_registros", tipo, ordenId];
  const regs = useQuery({
    queryKey: key,
    enabled: !!ordenId,
    queryFn: async (): Promise<Row[]> => (await db("calidad_registros").select("*").eq("tipo", tipo).eq("orden_id", ordenId)).data ?? [],
  });
  const estadosOt = useLookup("estados_ot");
  const [historico, setHistorico] = useState(false);
  const pendienteCalidad = (o: Row) => {
    const est = estadosOt.label(o.estado_id);
    const v = (verifs.data ?? []).find((x) => x.ot_id === o.id && x.gerencia === "calidad");
    return (est === "En ejecución" || est === "Terminada" || est.startsWith("Detenida")) && v?.estado !== "aprobada";
  };
  const lista = (tipo === "op" ? ops.data : (ots.data ?? []).filter((o) => historico || pendienteCalidad(o))) ?? [];
  const reg = (item: number, sub: number) => (regs.data ?? []).find((r) => r.item === item && r.sub === sub);
  const dinamicos = (n: number) => (regs.data ?? []).filter((r) => r.item === n && r.sub > 0).sort((a, b) => a.sub - b.sub);
  const confItem = (it: (typeof CALIDAD_ITEMS)[number]) => {
    if (it.subs.length) return consolidar(it.subs.map((_, i) => reg(it.n, i + 1)?.conformidad ?? "Pendiente"));
    const d = dinamicos(it.n);
    return d.length ? consolidar(d.map((r) => r.conformidad ?? "Pendiente")) : reg(it.n, 0)?.conformidad ?? "Pendiente";
  };

  async function agregarRenglon(n: number) {
    const sub = Math.max(0, ...dinamicos(n).map((r) => r.sub)) + 1;
    const { error } = await db("calidad_registros").insert({ tipo, orden_id: ordenId, item: n, sub, descripcion: "Nuevo renglón" });
    if (error) toast.error(error.message);
    setAbierto(n);
    qc.invalidateQueries({ queryKey: key });
  }
  async function borrarRenglon(id: number) {
    if (!confirm("¿Borrar este renglón?")) return;
    const { error } = await db("calidad_registros").delete().eq("id", id);
    if (error) toast.error(error.message);
    qc.invalidateQueries({ queryKey: key });
  }
  const otSel = tipo === "ot" ? (ots.data ?? []).find((o) => o.id === ordenId) : undefined;

  async function guardar(item: number, sub: number, campo: string, valor: unknown) {
    const { error } = await db("calidad_registros").upsert(
      { tipo, orden_id: ordenId, item, sub, ...(reg(item, sub) ?? {}), id: undefined, updated_at: undefined, updated_by: undefined, [campo]: valor === "" ? null : valor },
      { onConflict: "tipo,orden_id,item,sub" },
    );
    if (error) toast.error(error.message);
    qc.invalidateQueries({ queryKey: key });
  }

  const estados = CALIDAD_ITEMS.map(confItem);
  const aplican = estados.filter((e) => e !== "No aplica");
  const conformes = aplican.filter((e) => e === "Conforme").length;
  const ncr = estados.filter((e) => e === "No conforme").length;
  const kpis = [
    { l: "% Conformidad", v: aplican.length ? `${Math.round((conformes / aplican.length) * 100)}%` : "—" },
    { l: "Ítems conformes", v: `${conformes} / ${aplican.length}` },
    { l: "No conformes", v: ncr },
    { l: "Pendientes / en evaluación", v: aplican.length - conformes - ncr },
  ];

  function Fila({ n, sub, titulo, nivel, editable }: { n: number; sub: number; titulo: string; nivel: number; editable?: boolean }) {
    const r = reg(n, sub);
    const inp = "h-7 w-full rounded border border-input bg-card px-1 text-xs disabled:opacity-70";
    return (
      <tr className="border-b border-border">
        <td className="px-2 py-1 font-code text-xs">{String(n).padStart(2, "0")}{sub ? `.${String(sub).padStart(2, "0")}` : ""}</td>
        <td className={cn("px-2 py-1 text-xs", nivel && "pl-6")}>
          {editable ? (
            <div className="flex items-center gap-1">
              <input disabled={!puede} className={inp} defaultValue={titulo} onBlur={(e) => e.target.value !== titulo && guardar(n, sub, "descripcion", e.target.value)} />
              {puede && r && <button type="button" title="Borrar renglón" onClick={() => borrarRenglon(r.id)} className="text-destructive hover:opacity-70"><Trash2 className="h-3.5 w-3.5" /></button>}
            </div>
          ) : titulo}
        </td>
        <td className="w-16 px-1"><input disabled={!puede} type="number" className={inp} defaultValue={r?.cantidad ?? ""} onBlur={(e) => e.target.value !== String(r?.cantidad ?? "") && guardar(n, sub, "cantidad", e.target.value)} /></td>
        <td className="w-32 px-1">
          <select disabled={!puede} className={cn(inp, tono[r?.conformidad ?? "Pendiente"])} value={r?.conformidad ?? "Pendiente"} onChange={(e) => guardar(n, sub, "conformidad", e.target.value)}>
            {CONFORMIDADES.map((c) => <option key={c}>{c}</option>)}
          </select>
        </td>
        <td className="w-32 px-1"><input disabled={!puede} type="date" className={inp} defaultValue={r?.inicio ?? ""} onBlur={(e) => e.target.value !== (r?.inicio ?? "") && guardar(n, sub, "inicio", e.target.value)} /></td>
        <td className="w-32 px-1"><input disabled={!puede} type="date" className={inp} defaultValue={r?.cierre ?? ""} onBlur={(e) => e.target.value !== (r?.cierre ?? "") && guardar(n, sub, "cierre", e.target.value)} /></td>
        <td className="px-1"><input disabled={!puede} className={inp} defaultValue={r?.observaciones ?? ""} onBlur={(e) => e.target.value !== (r?.observaciones ?? "") && guardar(n, sub, "observaciones", e.target.value)} /></td>
        <td className="w-36 px-1"><input disabled={!puede} className={inp} placeholder="Código / enlace" defaultValue={r?.registro ?? ""} onBlur={(e) => e.target.value !== (r?.registro ?? "") && guardar(n, sub, "registro", e.target.value)} /></td>
      </tr>
    );
  }

  return (
    <div>
      <PageHeader title="Gestión de la Calidad" code="MÓDULO CALIDAD · EANSA" />
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <select className="h-9 rounded-md border border-input bg-card px-2 text-sm" value={tipo} onChange={(e) => { setTipo(e.target.value as "op" | "ot"); setOrdenId(null); }}>
          <option value="op">Orden de Producción</option>
          <option value="ot">Orden de Trabajo</option>
        </select>
        <select className="h-9 min-w-64 rounded-md border border-input bg-card px-2 text-sm" value={ordenId ?? ""} onChange={(e) => setOrdenId(e.target.value ? Number(e.target.value) : null)}>
          <option value="">Selecciona una orden…</option>
          {lista.map((o) => <option key={o.id} value={o.id}>{o.numero} — {o.producto ?? o.objeto ?? ""}</option>)}
        </select>
        {tipo === "ot" && (
          <div className="flex rounded-md border border-input text-sm">
            <button type="button" onClick={() => { setHistorico(false); setOrdenId(null); }} className={cn("px-3 py-1.5", !historico && "bg-primary text-primary-foreground")}>Pendientes</button>
            <button type="button" onClick={() => { setHistorico(true); setOrdenId(null); }} className={cn("px-3 py-1.5", historico && "bg-primary text-primary-foreground")}>Histórico / Todas</button>
          </div>
        )}
        {otSel && <BarraCompuertas ot={otSel} verifs={verifs.data ?? []} solo="calidad" />}
        {!puede && <span className="text-xs text-muted-foreground">Solo lectura: edita el inspector de Calidad o Gestión de la Producción.</span>}
      </div>
      {!ordenId ? (
        <p className="text-sm text-muted-foreground">Elige una OP u OT para abrir su tablero de calidad.</p>
      ) : (
        <>
          <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4">
            {kpis.map((k) => (
              <div key={k.l} className="rounded-md border border-border bg-card p-3">
                <div className="text-xs uppercase text-muted-foreground">{k.l}</div>
                <div className="font-code text-2xl font-semibold">{k.v}</div>
              </div>
            ))}
          </div>
          <div className="overflow-x-auto rounded-md border border-border bg-card">
            <table className="w-full min-w-[900px] text-left">
              <thead className="bg-secondary text-xs uppercase">
                <tr><th className="px-2 py-2">N°</th><th className="px-2">Descripción</th><th>Cant.</th><th>Conformidad</th><th>Inicio</th><th>Cierre</th><th>Observaciones</th><th>Registro</th></tr>
              </thead>
              <tbody>
                {CALIDAD_ITEMS.map((it, i) =>
                  it.subs.length ? (
                    <Fragment key={it.n}>
                      <tr className="cursor-pointer border-b border-border transition hover:bg-primary/10" onClick={() => setAbierto(abierto === it.n ? null : it.n)}>
                        <td className="px-2 py-2 font-code text-xs">{String(it.n).padStart(2, "0")}</td>
                        <td className="px-2 text-sm font-medium" colSpan={2}>
                          <span className="inline-flex items-center gap-1">{abierto === it.n ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}{it.titulo} <span className="text-xs text-muted-foreground">({it.subs.length})</span></span>
                        </td>
                        <td colSpan={5} className="px-1"><span className={cn("rounded-sm px-2 py-0.5 text-xs font-medium", tono[estados[i]])}>{estados[i]}</span></td>
                      </tr>
                      {abierto === it.n && it.subs.map((s, j) => <Fila key={j} n={it.n} sub={j + 1} titulo={s} nivel={1} />)}
                    </Fragment>
                  ) : (
                    <Fragment key={it.n}>
                      <tr className="cursor-pointer border-b border-border transition hover:bg-primary/10" onClick={() => setAbierto(abierto === it.n ? null : it.n)}>
                        <td className="px-2 py-2 font-code text-xs">{String(it.n).padStart(2, "0")}</td>
                        <td className="px-2 text-sm font-medium" colSpan={2}>
                          <span className="inline-flex items-center gap-1">{abierto === it.n ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}{it.titulo} <span className="text-xs text-muted-foreground">({dinamicos(it.n).length})</span></span>
                        </td>
                        <td colSpan={5} className="px-1"><span className={cn("rounded-sm px-2 py-0.5 text-xs font-medium", tono[estados[i]])}>{estados[i]}</span></td>
                      </tr>
                      {abierto === it.n && dinamicos(it.n).map((r) => <Fila key={r.id} n={it.n} sub={r.sub} titulo={r.descripcion ?? ""} nivel={1} editable />)}
                      {abierto === it.n && puede && (
                        <tr className="border-b border-border"><td /><td colSpan={7} className="py-1 pl-6">
                          <button type="button" onClick={() => agregarRenglon(it.n)} className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"><Plus className="h-3.5 w-3.5" /> Agregar renglón</button>
                        </td></tr>
                      )}
                    </Fragment>
                  ),
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
