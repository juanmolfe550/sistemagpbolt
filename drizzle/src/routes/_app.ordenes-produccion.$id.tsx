import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Pencil, Plus, Printer, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { db, fmtDate, fmtNum, useInvalidate, useLookup, useRows, type Row } from "@/lib/data";
import { OP_FIELDS, OT_FIELDS } from "@/lib/entities";
import { useAuth } from "@/lib/auth";
import { EntityForm } from "@/components/EntityForm";
import { InformeOP, InformeOT, useInformePrinter } from "@/components/informes";
import { AlertaDetenida, AvanceBar, EstadoBadge, PageHeader } from "@/components/ui-bits";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export const Route = createFileRoute("/_app/ordenes-produccion/$id")({
  head: () => ({
    meta: [
      { title: "Detalle de OP — Gestión de Producción" },
      { name: "description", content: "Orden de producción con sus órdenes de trabajo asociadas." },
      { property: "og:title", content: "Detalle de orden de producción" },
      { property: "og:description", content: "Orden de producción con sus órdenes de trabajo asociadas." },
    ],
  }),
  component: OpDetail,
});

function Info({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="mt-0.5 whitespace-pre-wrap text-sm">{children || "—"}</div>
    </div>
  );
}

function OpDetail() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const { canEdit, roles } = useAuth();
  const canEditOt = canEdit || roles.includes("operario");
  const ops = useRows("ordenes_produccion");
  const ots = useRows("ordenes_trabajo", "numero");
  const clientes = useLookup("clientes");
  const tipos = useLookup("tipos_produccion");
  const estOp = useLookup("estados_op");
  const estOt = useLookup("estados_ot");
  const ger = useLookup("gerencias");
  const emp = useLookup("empleados");
  const invalidate = useInvalidate();
  const [editOp, setEditOp] = useState(false);
  const [otOpen, setOtOpen] = useState(false);
  const [ot, setOt] = useState<Row | null>(null);
  const { print, printArea } = useInformePrinter();

  const op = (ops.data ?? []).find((o) => String(o.id) === id);
  if (ops.isLoading) return <div className="text-muted-foreground">Cargando…</div>;
  if (!op) return <div>No se encontró la orden de producción.</div>;
  const hijas = (ots.data ?? []).filter((o) => o.op_id === op.id);
  const hhPlan = hijas.reduce((a, o) => a + Number(o.hh_planificadas ?? 0), 0);
  const hhEjec = hijas.reduce((a, o) => a + Number(o.hh_ejecutadas ?? 0), 0);
  const avanceOts = hijas.length ? hijas.reduce((a, o) => a + Number(o.avance ?? 0), 0) / hijas.length : 0;

  async function removeOp() {
    if (!confirm(`¿Eliminar la OP ${op!.numero} y sus ${hijas.length} OT?`)) return undefined;
    const { error } = await db("ordenes_produccion").delete().eq("id", op!.id);
    if (error) { toast.error(error.message); return; }
    invalidate("ordenes_produccion");
    invalidate("ordenes_trabajo");
    navigate({ to: "/ordenes-produccion" });
  }
  async function removeOt(r: Row) {
    if (!confirm(`¿Eliminar la OT ${r.numero}?`)) return undefined;
    const { error } = await db("ordenes_trabajo").delete().eq("id", r.id);
    if (error) { toast.error(error.message); return; }
    invalidate("ordenes_trabajo");
  }

  return (
    <div>
      <Link to="/ordenes-produccion" className="no-print mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Órdenes de producción
      </Link>
      <PageHeader title={op.producto} code={`OP ${op.numero}`}>
        <Button
          variant="outline"
          onClick={() =>
            print(
              <InformeOP
                op={op}
                ots={hijas}
                lk={{
                  clientes: clientes.label,
                  empleados: emp.label,
                  gerencias: ger.label,
                  estados: (i) => estOp.map.get(i ?? 0) ?? "—",
                  tipos: tipos.label,
                }}
              />,
            )
          }
        >
          <Printer className="h-4 w-4" /> Imprimir informe
        </Button>
        {canEdit && (
          <>
            <Button variant="outline" onClick={() => setEditOp(true)}>
              <Pencil className="h-4 w-4" /> Editar
            </Button>
            <Button variant="outline" onClick={removeOp}>
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </>
        )}
      </PageHeader>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 rounded-lg border border-border bg-card p-5 lg:col-span-2">
          <div className="grid gap-4 sm:grid-cols-3">
            <Info label="Cliente">{clientes.label(op.cliente_id)}</Info>
            <Info label="Tipo de producción">{tipos.label(op.tipo_produccion_id)}</Info>
            <Info label="Estado"><EstadoBadge nombre={estOp.map.get(op.estado_id)} /><AlertaDetenida ots={hijas} estadosOt={estOt.map} /></Info>
            <Info label="Fecha de elaboración">{fmtDate(op.fecha)}</Info>
            <Info label="Cantidad">{fmtNum(op.cantidad, 2)} {op.unidad_medida}</Info>
            <Info label="Prioridad"><span className="capitalize">{op.prioridad}</span></Info>
            <Info label="Gerencia / Proyecto">{ger.label(op.gerencia_id)}</Info>
            <Info label="Responsable">{emp.label(op.responsable_id)}</Info>
            <Info label="Revisión">{op.revision}</Info>
          </div>
          <div className="grid gap-4 border-t border-border pt-4 sm:grid-cols-2">
            <Info label="Descripción">{op.descripcion}</Info>
            <Info label="Especificaciones">{op.especificaciones}</Info>
            <Info label="Requisitos">{op.requisitos}</Info>
            <Info label="Documentación de referencia">{op.documentacion_referencia}</Info>
          </div>
          {op.no_conformidad && (
            <div className="grid gap-4 rounded-md border border-destructive/40 bg-destructive/5 p-3 sm:grid-cols-2">
              <Info label="No conformidad">{op.identificacion_no_conformidad}</Info>
              <Info label="Tratamiento">{op.tratamiento}</Info>
            </div>
          )}
        </div>
        <div className="space-y-4 rounded-lg border border-border bg-card p-5">
          <Info label="Compromiso de entrega">{fmtDate(op.fecha_compromiso)}</Info>
          <Info label="Plan">{fmtDate(op.fecha_inicio_plan)} → {fmtDate(op.fecha_fin_plan)}</Info>
          <Info label="Real">{fmtDate(op.fecha_inicio_real)} → {fmtDate(op.fecha_fin_real)}</Info>
          <div className="grid grid-cols-2 gap-3 border-t border-border pt-4">
            <Info label="HH plan (OT)"><span className="font-code text-lg">{fmtNum(hhPlan, 1)}</span></Info>
            <Info label="HH ejecutadas (OT)"><span className="font-code text-lg">{fmtNum(hhEjec, 1)}</span></Info>
          </div>
          <Info label="Avance promedio de OT"><AvanceBar value={avanceOts} /></Info>
          <Info label="Costo de fabricación">{fmtNum(op.costo_fabricacion, 2)}</Info>
        </div>
      </div>

      <div className="mt-8 mb-3 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Órdenes de trabajo asociadas <span className="font-code text-muted-foreground">({hijas.length})</span></h2>
        {canEdit && (
          <Button className="no-print" onClick={() => { setOt(null); setOtOpen(true); }}>
            <Plus className="h-4 w-4" /> Nueva OT
          </Button>
        )}
      </div>
      <div className="rounded-lg border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>N° OT</TableHead>
              <TableHead>Objeto</TableHead>
              <TableHead>Gerencia</TableHead>
              <TableHead>Responsable</TableHead>
              <TableHead>Plan</TableHead>
              <TableHead>HH plan / ejec.</TableHead>
              <TableHead>Avance</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="no-print w-24" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {hijas.length === 0 && (
              <TableRow><TableCell colSpan={9} className="text-muted-foreground">Esta OP aún no tiene órdenes de trabajo.</TableCell></TableRow>
            )}
            {hijas.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="font-code font-medium">{r.numero}</TableCell>
                <TableCell>{r.objeto ?? "—"}</TableCell>
                <TableCell>{ger.label(r.gerencia_id)}</TableCell>
                <TableCell>{emp.label(r.responsable_id)}</TableCell>
                <TableCell className="font-code text-xs">{fmtDate(r.fecha_inicio_plan)} → {fmtDate(r.fecha_fin_plan)}</TableCell>
                <TableCell className="font-code">{fmtNum(r.hh_planificadas, 1)} / {fmtNum(r.hh_ejecutadas, 1)}</TableCell>
                <TableCell><AvanceBar value={r.avance} /></TableCell>
                <TableCell><EstadoBadge nombre={estOt.map.get(r.estado_id)} /></TableCell>
                <TableCell className="no-print text-right">
                  <Button
                    size="icon"
                    variant="ghost"
                    title="Imprimir informe de OT"
                    onClick={() =>
                      print(
                        <InformeOT
                          ot={r}
                          lk={{
                            empleados: emp.label,
                            gerencias: ger.label,
                            estados: (i) => estOt.map.get(i ?? 0) ?? "—",
                            ops: (i) => op.numero,
                          }}
                        />,
                      )
                    }
                  >
                    <Printer className="h-4 w-4" />
                  </Button>
                  {canEditOt && (
                    <Button size="icon" variant="ghost" onClick={() => { setOt(r); setOtOpen(true); }}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                  )}
                  {canEdit && (
                    <Button size="icon" variant="ghost" onClick={() => removeOt(r)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <EntityForm open={editOp} onOpenChange={setEditOp} table="ordenes_produccion" title={`Editar OP ${op.numero}`} fields={OP_FIELDS} initial={op} onSaved={() => invalidate("ordenes_produccion")} />
      <EntityForm
        open={otOpen}
        onOpenChange={setOtOpen}
        table="ordenes_trabajo"
        title={ot ? `Editar OT ${ot.numero}` : `Nueva OT para OP ${op.numero}`}
        fields={OT_FIELDS}
        initial={ot}
        defaults={{ op_id: op.id, gerencia_id: op.gerencia_id, cantidad: 1, estado_id: 1, avance: 0, hh_planificadas: 0, hh_ejecutadas: 0, tiene_dependencia: false, no_programada: false, no_conformidad: false, fecha_elaboracion: new Date().toISOString().slice(0, 10) }}
        onSaved={() => invalidate("ordenes_trabajo")}
      />
      {printArea}
    </div>
  );
}
