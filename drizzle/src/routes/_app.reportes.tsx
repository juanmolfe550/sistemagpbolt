import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Download, Printer } from "lucide-react";
import { fmtDate, fmtNum, useLookup, useRows, type Row } from "@/lib/data";
import { EstadoBadge, PageHeader } from "@/components/ui-bits";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export const Route = createFileRoute("/_app/reportes")({
  head: () => ({
    meta: [
      { title: "Reportes — Gestión de Producción" },
      { name: "description", content: "Informes de órdenes de producción y de trabajo." },
      { property: "og:title", content: "Reportes de producción" },
      { property: "og:description", content: "Informes de órdenes de producción y de trabajo." },
    ],
  }),
  component: Reportes,
});

function downloadCsv(name: string, header: string[], rows: (string | number)[][]) {
  const esc = (v: string | number) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const csv = "\uFEFF" + [header, ...rows].map((r) => r.map(esc).join(";")).join("\n");
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  a.download = name;
  a.click();
}

function Reportes() {
  const ops = useRows("ordenes_produccion", "fecha").data ?? [];
  const ots = useRows("ordenes_trabajo", "numero").data ?? [];
  const clientes = useLookup("clientes");
  const estOp = useLookup("estados_op");
  const estOt = useLookup("estados_ot");
  const ger = useLookup("gerencias");
  const emp = useLookup("empleados");
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");
  const [gerencia, setGerencia] = useState("");
  const [tab, setTab] = useState("op");

  const inRange = (d?: string) => (!desde || (d ?? "") >= desde) && (!hasta || (d ?? "") <= hasta);
  const fOps = ops.filter((o) => inRange(o.fecha) && (!gerencia || String(o.gerencia_id) === gerencia));
  const fOts = ots.filter((o) => inRange(o.fecha_inicio_plan ?? o.fecha_asignacion) && (!gerencia || String(o.gerencia_id) === gerencia));
  const opNum = (id: number) => ops.find((o) => o.id === id)?.numero ?? "—";

  function exportar() {
    if (tab === "op")
      downloadCsv("informe_op.csv", ["N° OP", "Fecha de elaboración", "Cliente", "Producto", "Cantidad", "Gerencia", "Responsable", "Compromiso", "N° OT", "Avance %", "Estado"],
        fOps.map((o) => [o.numero, fmtDate(o.fecha), clientes.label(o.cliente_id), o.producto, `${o.cantidad} ${o.unidad_medida ?? ""}`, ger.label(o.gerencia_id), emp.label(o.responsable_id), fmtDate(o.fecha_compromiso), ots.filter((t) => t.op_id === o.id).length, o.avance, estOp.label(o.estado_id)]));
    else
      downloadCsv("informe_ot.csv", ["N° OT", "OP", "Objeto", "Gerencia", "Responsable", "Inicio plan", "Fin plan", "HH plan", "HH ejec", "Avance %", "Estado"],
        fOts.map((o: Row) => [o.numero, opNum(o.op_id), o.objeto ?? "", ger.label(o.gerencia_id), emp.label(o.responsable_id), fmtDate(o.fecha_inicio_plan), fmtDate(o.fecha_fin_plan), o.hh_planificadas, o.hh_ejecutadas, o.avance, estOt.label(o.estado_id)]));
  }

  return (
    <div>
      <PageHeader title="Reportes" code="Informes">
        <Button variant="outline" onClick={exportar}><Download className="h-4 w-4" /> Exportar a Excel</Button>
        <Button onClick={() => window.print()}><Printer className="h-4 w-4" /> Imprimir</Button>
      </PageHeader>
      <div className="no-print mb-4 flex flex-wrap items-end gap-3">
        <label className="text-xs text-muted-foreground">Desde<Input type="date" value={desde} onChange={(e) => setDesde(e.target.value)} /></label>
        <label className="text-xs text-muted-foreground">Hasta<Input type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} /></label>
        <label className="text-xs text-muted-foreground">Gerencia
          <select className="block h-9 rounded-md border border-input bg-card px-2 text-sm text-foreground" value={gerencia} onChange={(e) => setGerencia(e.target.value)}>
            <option value="">Todas</option>
            {ger.rows.map((g) => <option key={g.id} value={g.id}>{g.nombre}</option>)}
          </select>
        </label>
      </div>
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="no-print">
          <TabsTrigger value="op">Informe de OP ({fOps.length})</TabsTrigger>
          <TabsTrigger value="ot">Informe de OT ({fOts.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="op">
          <div className="rounded-lg border border-border bg-card">
            <Table>
              <TableHeader><TableRow>
                <TableHead>N° OP</TableHead><TableHead>Fecha de elaboración</TableHead><TableHead>Cliente</TableHead><TableHead>Producto</TableHead><TableHead>Gerencia</TableHead><TableHead>Responsable</TableHead><TableHead>Compromiso</TableHead><TableHead>OT</TableHead><TableHead>Estado</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {fOps.map((o) => (
                  <TableRow key={o.id}>
                    <TableCell className="font-code">{o.numero}</TableCell><TableCell className="font-code text-xs">{fmtDate(o.fecha)}</TableCell><TableCell>{clientes.label(o.cliente_id)}</TableCell><TableCell>{o.producto}</TableCell><TableCell>{ger.label(o.gerencia_id)}</TableCell><TableCell>{emp.label(o.responsable_id)}</TableCell><TableCell className="font-code text-xs">{fmtDate(o.fecha_compromiso)}</TableCell><TableCell className="font-code">{ots.filter((t) => t.op_id === o.id).length}</TableCell><TableCell><EstadoBadge nombre={estOp.map.get(o.estado_id)} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
        <TabsContent value="ot">
          <div className="rounded-lg border border-border bg-card">
            <Table>
              <TableHeader><TableRow>
                <TableHead>N° OT</TableHead><TableHead>OP</TableHead><TableHead>Objeto</TableHead><TableHead>Gerencia</TableHead><TableHead>Responsable</TableHead><TableHead>Plan</TableHead><TableHead>HH plan/ejec</TableHead><TableHead>Avance</TableHead><TableHead>Estado</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {fOts.map((o) => (
                  <TableRow key={o.id}>
                    <TableCell className="font-code">{o.numero}</TableCell><TableCell className="font-code">{opNum(o.op_id)}</TableCell><TableCell>{o.objeto ?? "—"}</TableCell><TableCell>{ger.label(o.gerencia_id)}</TableCell><TableCell>{emp.label(o.responsable_id)}</TableCell><TableCell className="font-code text-xs">{fmtDate(o.fecha_inicio_plan)} → {fmtDate(o.fecha_fin_plan)}</TableCell><TableCell className="font-code">{fmtNum(o.hh_planificadas, 1)} / {fmtNum(o.hh_ejecutadas, 1)}</TableCell><TableCell className="font-code">{Math.round(o.avance)}%</TableCell><TableCell><EstadoBadge nombre={estOt.map.get(o.estado_id)} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
