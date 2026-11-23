import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Search } from "lucide-react";
import { useLookup, useInvalidate, useRows, fmtDate } from "@/lib/data";
import { OP_FIELDS } from "@/lib/entities";
import { useAuth } from "@/lib/auth";
import { EntityForm } from "@/components/EntityForm";
import { AlertaDetenida, AvanceBar, EstadoBadge, PageHeader } from "@/components/ui-bits";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export const Route = createFileRoute("/_app/ordenes-produccion/")({
  head: () => ({
    meta: [
      { title: "Órdenes de producción — Gestión de Producción" },
      { name: "description", content: "Listado y registro de órdenes de producción." },
      { property: "og:title", content: "Órdenes de producción" },
      { property: "og:description", content: "Listado y registro de órdenes de producción." },
    ],
  }),
  component: OpList,
});

function OpList() {
  const { canEdit } = useAuth();
  const { data = [], isLoading } = useRows("ordenes_produccion", "fecha", false);
  const ots = useRows("ordenes_trabajo").data ?? [];
  const clientes = useLookup("clientes");
  const estados = useLookup("estados_op");
  const estOt = useLookup("estados_ot");
  const gerencias = useLookup("gerencias");
  const invalidate = useInvalidate();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [estado, setEstado] = useState("");

  const rows = data.filter(
    (r) =>
      (!estado || String(r.estado_id) === estado) &&
      (!q || `${r.numero} ${r.producto} ${clientes.label(r.cliente_id)}`.toLowerCase().includes(q.toLowerCase())),
  );

  return (
    <div>
      <PageHeader title="Órdenes de producción" code={`${data.length} OP registradas`}>
        <select className="h-9 rounded-md border border-input bg-card px-2 text-sm" value={estado} onChange={(e) => setEstado(e.target.value)}>
          <option value="">Todos los estados</option>
          {estados.rows.map((e) => (
            <option key={e.id} value={e.id}>{e.nombre}</option>
          ))}
        </select>
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input className="w-56 pl-8" placeholder="N°, producto o cliente" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        {canEdit && (
          <Button onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4" /> Nueva OP
          </Button>
        )}
      </PageHeader>
      <div className="rounded-lg border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>N° OP</TableHead>
              <TableHead>Fecha de elaboración</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Producto / Servicio</TableHead>
              <TableHead>Gerencia</TableHead>
              <TableHead>Compromiso</TableHead>
              <TableHead>OT</TableHead>
              <TableHead>Avance</TableHead>
              <TableHead>Estado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow><TableCell colSpan={9} className="text-muted-foreground">Cargando…</TableCell></TableRow>
            )}
            {rows.map((r) => (
              <TableRow key={r.id}>
                <TableCell>
                  <Link to="/ordenes-produccion/$id" params={{ id: String(r.id) }} className="font-code font-medium text-foreground underline-offset-4 hover:underline">
                    {r.numero}
                  </Link>
                </TableCell>
                <TableCell className="font-code text-xs">{fmtDate(r.fecha)}</TableCell>
                <TableCell>{clientes.label(r.cliente_id)}</TableCell>
                <TableCell>{r.producto}</TableCell>
                <TableCell>{gerencias.label(r.gerencia_id)}</TableCell>
                <TableCell className="font-code text-xs">{fmtDate(r.fecha_compromiso)}</TableCell>
                <TableCell className="font-code">{ots.filter((o) => o.op_id === r.id).length}</TableCell>
                <TableCell><AvanceBar value={r.avance} /></TableCell>
                <TableCell><EstadoBadge nombre={estados.map.get(r.estado_id)} /><AlertaDetenida ots={ots.filter((o) => o.op_id === r.id)} estadosOt={estOt.map} /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <EntityForm
        open={open}
        onOpenChange={setOpen}
        table="ordenes_produccion"
        title="Nueva orden de producción"
        fields={OP_FIELDS}
        defaults={{ fecha: new Date().toISOString().slice(0, 10), cantidad: 1, estado_id: 1, avance: 0, hh_planificadas: 0, hh_ejecutadas: 0, no_conformidad: false }}
        onSaved={() => invalidate("ordenes_produccion")}
      />
    </div>
  );
}
