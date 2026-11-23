import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Pencil, Printer, Search } from "lucide-react";
import { fmtDate, fmtNum, useInvalidate, useLookup, useRows, type Row } from "@/lib/data";
import { OT_FIELDS } from "@/lib/entities";
import { useAuth } from "@/lib/auth";
import { EntityForm } from "@/components/EntityForm";
import { BarraCompuertas, useVerificaciones } from "@/components/Compuertas";
import { InformeOT, useInformePrinter } from "@/components/informes";
import { AvanceBar, EstadoBadge, PageHeader } from "@/components/ui-bits";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export const Route = createFileRoute("/_app/ordenes-trabajo")({
  head: () => ({
    meta: [
      { title: "Órdenes de trabajo — Gestión de Producción" },
      { name: "description", content: "Todas las órdenes de trabajo y su avance." },
      { property: "og:title", content: "Órdenes de trabajo" },
      { property: "og:description", content: "Todas las órdenes de trabajo y su avance." },
    ],
  }),
  component: OtList,
});

function OtList() {
  const { canEdit, roles } = useAuth();
  const canEditOt = canEdit || roles.includes("operario");
  const verifs = useVerificaciones();
  const { data = [], isLoading } = useRows("ordenes_trabajo", "fecha_inicio_plan", false);
  const ops = useLookup("ordenes_produccion");
  const estados = useLookup("estados_ot");
  const ger = useLookup("gerencias");
  const emp = useLookup("empleados");
  const invalidate = useInvalidate();
  const [q, setQ] = useState("");
  const [estado, setEstado] = useState("");
  const [gerencia, setGerencia] = useState("");
  const [edit, setEdit] = useState<Row | null>(null);
  const { print, printArea } = useInformePrinter();

  const rows = data.filter(
    (r) =>
      (!estado || String(r.estado_id) === estado) &&
      (!gerencia || String(r.gerencia_id) === gerencia) &&
      (!q || `${r.numero} ${r.objeto ?? ""} ${ops.label(r.op_id)} ${emp.label(r.responsable_id)}`.toLowerCase().includes(q.toLowerCase())),
  );

  return (
    <div>
      <PageHeader title="Órdenes de trabajo" code={`${data.length} OT registradas`}>
        <select className="h-9 rounded-md border border-input bg-card px-2 text-sm" value={gerencia} onChange={(e) => setGerencia(e.target.value)}>
          <option value="">Todas las gerencias</option>
          {ger.rows.map((g) => <option key={g.id} value={g.id}>{g.nombre}</option>)}
        </select>
        <select className="h-9 rounded-md border border-input bg-card px-2 text-sm" value={estado} onChange={(e) => setEstado(e.target.value)}>
          <option value="">Todos los estados</option>
          {estados.rows.map((e) => <option key={e.id} value={e.id}>{e.nombre}</option>)}
        </select>
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input className="w-56 pl-8" placeholder="N°, objeto, OP o responsable" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
      </PageHeader>
      <p className="mb-3 text-sm text-muted-foreground">Las nuevas OT se crean desde la orden de producción a la que pertenecen.</p>
      <div className="rounded-lg border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>N° OT</TableHead>
              <TableHead>OP</TableHead>
              <TableHead>Objeto</TableHead>
              <TableHead>Gerencia</TableHead>
              <TableHead>Responsable</TableHead>
              <TableHead>Plan</TableHead>
              <TableHead>HH plan / ejec.</TableHead>
              <TableHead>Avance</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Inspecciones</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && <TableRow><TableCell colSpan={10} className="text-muted-foreground">Cargando…</TableCell></TableRow>}
            {rows.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="font-code font-medium">{r.numero}</TableCell>
                <TableCell>
                  <Link to="/ordenes-produccion/$id" params={{ id: String(r.op_id) }} className="font-code text-sm underline-offset-4 hover:underline">
                    {ops.label(r.op_id)}
                  </Link>
                </TableCell>
                <TableCell>{r.objeto ?? "—"}</TableCell>
                <TableCell>{ger.label(r.gerencia_id)}</TableCell>
                <TableCell>{emp.label(r.responsable_id)}</TableCell>
                <TableCell className="font-code text-xs">{fmtDate(r.fecha_inicio_plan)} → {fmtDate(r.fecha_fin_plan)}</TableCell>
                <TableCell className="font-code">{fmtNum(r.hh_planificadas, 1)} / {fmtNum(r.hh_ejecutadas, 1)}</TableCell>
                <TableCell><AvanceBar value={r.avance} /></TableCell>
                <TableCell><EstadoBadge nombre={estados.map.get(r.estado_id)} /></TableCell>
                <TableCell><BarraCompuertas ot={r} verifs={verifs.data ?? []} compact /></TableCell>
                <TableCell className="whitespace-nowrap">
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
                            estados: (i) => estados.map.get(i ?? 0) ?? "—",
                            ops: ops.label,
                          }}
                        />,
                      )
                    }
                  >
                    <Printer className="h-4 w-4" />
                  </Button>
                  {canEditOt && (
                    <Button size="icon" variant="ghost" onClick={() => setEdit(r)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <EntityForm
        open={!!edit}
        onOpenChange={(o) => !o && setEdit(null)}
        table="ordenes_trabajo"
        title={`Editar OT ${edit?.numero ?? ""}`}
        fields={OT_FIELDS}
        initial={edit}
        onSaved={() => invalidate("ordenes_trabajo")}
      />
      {printArea}
    </div>
  );
}
