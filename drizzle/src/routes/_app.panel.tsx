import { createFileRoute, Link } from "@tanstack/react-router";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { fmtDate, fmtNum, useLookup, useRows } from "@/lib/data";
import { EstadoBadge, Kpi, PageHeader } from "@/components/ui-bits";

export const Route = createFileRoute("/_app/panel")({
  head: () => ({
    meta: [
      { title: "Panel — Gestión de Producción" },
      { name: "description", content: "Indicadores de órdenes de producción y de trabajo." },
      { property: "og:title", content: "Panel de producción" },
      { property: "og:description", content: "Indicadores de órdenes de producción y de trabajo." },
    ],
  }),
  component: Panel,
});

const CERRADOS_OP = /cumpl|cerrad|cancel/i;
const CERRADOS_OT = /culmin|cerrad|cancel/i;

function Panel() {
  const ops = useRows("ordenes_produccion").data ?? [];
  const ots = useRows("ordenes_trabajo").data ?? [];
  const estOp = useLookup("estados_op");
  const estOt = useLookup("estados_ot");
  const ger = useLookup("gerencias");
  const clientes = useLookup("clientes");
  const hoy = new Date().toISOString().slice(0, 10);

  const opAbiertas = ops.filter((o) => !CERRADOS_OP.test(estOp.label(o.estado_id)));
  const otAbiertas = ots.filter((o) => !CERRADOS_OT.test(estOt.label(o.estado_id)));
  const opVencidas = opAbiertas.filter((o) => o.fecha_compromiso && o.fecha_compromiso < hoy);
  const otVencidas = otAbiertas.filter((o) => o.fecha_fin_plan && o.fecha_fin_plan < hoy);
  const hhPlan = ots.reduce((a, o) => a + Number(o.hh_planificadas ?? 0), 0);
  const hhEjec = ots.reduce((a, o) => a + Number(o.hh_ejecutadas ?? 0), 0);

  const porEstadoOp = estOp.rows.map((e) => ({ estado: e.nombre, OP: ops.filter((o) => o.estado_id === e.id).length })).filter((x) => x.OP);
  const porEstadoOt = estOt.rows.map((e) => ({ estado: e.nombre, OT: ots.filter((o) => o.estado_id === e.id).length })).filter((x) => x.OT);
  const hhGerencia = ger.rows.map((g) => {
    const l = ots.filter((o) => o.gerencia_id === g.id);
    return { gerencia: g.siglas || g.nombre, Planificadas: l.reduce((a, o) => a + Number(o.hh_planificadas ?? 0), 0), Ejecutadas: l.reduce((a, o) => a + Number(o.hh_ejecutadas ?? 0), 0) };
  });

  return (
    <div>
      <PageHeader title="Panel de producción" code={new Date().toLocaleDateString("es-VE", { dateStyle: "full" })} />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi label="OP abiertas" value={opAbiertas.length} hint={`${ops.length} en total`} />
        <Kpi label="OT abiertas" value={otAbiertas.length} hint={`${ots.length} en total`} />
        <Kpi label="Vencidas" value={<span className={opVencidas.length + otVencidas.length ? "text-destructive" : ""}>{opVencidas.length + otVencidas.length}</span>} hint={`${opVencidas.length} OP · ${otVencidas.length} OT`} />
        <Kpi label="HH ejecutadas / plan" value={`${fmtNum(hhEjec)}/${fmtNum(hhPlan)}`} hint={hhPlan ? `${Math.round((hhEjec / hhPlan) * 100)}% consumido` : undefined} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <ChartCard title="OP por estado">
          <BarChart data={porEstadoOp} layout="vertical" margin={{ left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis type="number" allowDecimals={false} fontSize={11} />
            <YAxis type="category" dataKey="estado" width={110} fontSize={11} />
            <Tooltip />
            <Bar dataKey="OP" fill="var(--chart-1)" radius={[0, 3, 3, 0]} />
          </BarChart>
        </ChartCard>
        <ChartCard title="OT por estado">
          <BarChart data={porEstadoOt} layout="vertical" margin={{ left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis type="number" allowDecimals={false} fontSize={11} />
            <YAxis type="category" dataKey="estado" width={110} fontSize={11} />
            <Tooltip />
            <Bar dataKey="OT" fill="var(--chart-2)" radius={[0, 3, 3, 0]} />
          </BarChart>
        </ChartCard>
        <ChartCard title="Horas-hombre por gerencia">
          <BarChart data={hhGerencia}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="gerencia" fontSize={11} />
            <YAxis fontSize={11} />
            <Tooltip />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Bar dataKey="Planificadas" fill="var(--chart-2)" />
            <Bar dataKey="Ejecutadas" fill="var(--chart-1)" />
          </BarChart>
        </ChartCard>
      </div>

      <div className="mt-6 rounded-lg border border-border bg-card p-5">
        <h2 className="mb-3 font-semibold">OP abiertas por fecha de compromiso</h2>
        <div className="divide-y divide-border">
          {[...opAbiertas].sort((a, b) => (a.fecha_compromiso ?? "9").localeCompare(b.fecha_compromiso ?? "9")).map((o) => (
            <Link key={o.id} to="/ordenes-produccion/$id" params={{ id: String(o.id) }} className="flex items-center justify-between gap-4 py-2.5 hover:bg-muted/50">
              <div className="flex items-center gap-3">
                <span className="font-code text-sm font-medium">{o.numero}</span>
                <span className="text-sm">{o.producto}</span>
                <span className="text-sm text-muted-foreground">· {clientes.label(o.cliente_id)}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className={`font-code text-xs ${o.fecha_compromiso && o.fecha_compromiso < hoy ? "text-destructive" : "text-muted-foreground"}`}>{fmtDate(o.fecha_compromiso)}</span>
                <EstadoBadge nombre={estOp.map.get(o.estado_id)} />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactElement }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <h3 className="mb-2 text-sm font-semibold">{title}</h3>
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">{children}</ResponsiveContainer>
      </div>
    </div>
  );
}
