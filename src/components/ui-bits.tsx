import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function PageHeader({ title, code, children }: { title: string; code?: string | undefined; children?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4 border-b border-border pb-4">
      <div>
        {code && <div className="font-code text-xs uppercase tracking-widest text-muted-foreground">{code}</div>}
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
      </div>
      <div className="no-print flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

const estadoTone = (n?: string) => {
  const s = (n ?? "").toLowerCase();
  if (/cancel|deten/.test(s)) return "bg-destructive/15 text-destructive";
  if (/cumpl|culmin|cerrad/.test(s)) return "bg-success/15 text-success";
  if (/ejecu|producc|parcial/.test(s)) return "bg-primary/25 text-accent-foreground";
  if (/espera|revis/.test(s)) return "bg-warning/30 text-warning-foreground";
  return "bg-secondary text-secondary-foreground";
};

export function EstadoBadge({ nombre }: { nombre?: string | undefined }) {
  return (
    <span className={cn("inline-flex whitespace-nowrap rounded-sm px-2 py-0.5 text-xs font-medium", estadoTone(nombre))}>
      {nombre ?? "—"}
    </span>
  );
}

export function AvanceBar({ value }: { value?: number | null }) {
  const v = Math.max(0, Math.min(100, Number(value ?? 0)));
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-secondary">
        <div className="h-full bg-primary" style={{ width: `${v}%` }} />
      </div>
      <span className="font-code text-xs tabular-nums text-muted-foreground">{Math.round(v)}%</span>
    </div>
  );
}

export function Kpi({ label, value, hint }: { label: string; value: ReactNode; hint?: string | undefined }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="mt-1 font-code text-3xl font-semibold tabular-nums">{value}</div>
      {hint && <div className="mt-1 text-xs text-muted-foreground">{hint}</div>}
    </div>
  );
}

/** Bandera de OP detenida: alguna OT hija en espera de material o bloqueada por ingeniería. */
export function AlertaDetenida({ ots, estadosOt }: { ots: { numero: string; estado_id: number | null }[]; estadosOt: Map<number, string> }) {
  const det = ots.filter((o) => {
    const n = (o.estado_id && estadosOt.get(o.estado_id)) || "";
    return n === "En espera de material" || n.startsWith("Bloqueada por Ingenier");
  });
  if (!det.length) return null;
  return (
    <span className="ml-2 inline-flex items-center rounded bg-destructive/15 px-1.5 py-0.5 text-[11px] font-semibold text-destructive" title={det.map((o) => `${o.numero}: ${estadosOt.get(o.estado_id!)}`).join("\n")}>
      ⚠ Detenida por OT {det.map((o) => o.numero).join(", ")}
    </span>
  );
}
