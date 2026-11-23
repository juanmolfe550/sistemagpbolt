import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { LOOKUP_LABEL, type LookupTable } from "./entities";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const db = (table: string) => supabase.from(table as any) as any;

export type Row = any; // eslint-disable-line @typescript-eslint/no-explicit-any

export function useRows(table: string, order = "id", ascending = true) {
  return useQuery({
    queryKey: ["rows", table],
    queryFn: async (): Promise<Row[]> => {
      const { data, error } = await db(table).select("*").order(order, { ascending });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useLookup(table: LookupTable) {
  const q = useRows(table, LOOKUP_LABEL[table]);
  const map = new Map<number, string>();
  (q.data ?? []).forEach((r) => map.set(r.id, r[LOOKUP_LABEL[table]]));
  return { rows: q.data ?? [], map, label: (id: number | null | undefined) => (id ? map.get(id) ?? "—" : "—") };
}

export function useInvalidate() {
  const qc = useQueryClient();
  return (table: string) => {
    // Los estados de OP y OT se actualizan entre sí automáticamente en la base de datos.
    const linked = table === "ordenes_trabajo" || table === "ordenes_produccion" ? ["ordenes_trabajo", "ordenes_produccion"] : [table];
    linked.forEach((t) => qc.invalidateQueries({ queryKey: ["rows", t] }));
  };
}

export function fmtDate(v?: string | null) {
  if (!v) return "—";
  const [y, m, d] = v.slice(0, 10).split("-");
  return `${d}/${m}/${y}`;
}

export function fmtNum(v?: number | null, dec = 0) {
  if (v === null || v === undefined) return "—";
  return Number(v).toLocaleString("es-VE", { maximumFractionDigits: dec });
}
