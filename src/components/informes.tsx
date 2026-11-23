import { fmtDesviacionDias, fmtDesviacionHH, fmtTiempoEntrega } from "@/lib/calculos";
// Documentos impresos oficiales (informes) de OP y OT, con bloque de firmas.
// Se renderizan ocultos en pantalla y solo aparecen al imprimir (ver .print-area en styles.css).
import { useCallback, useEffect, useState, type ReactNode } from "react";
import { fmtDate, fmtNum, type Row } from "@/lib/data";

type LabelFn = (id: number | null | undefined) => string;

type Labels = {
  clientes?: LabelFn;
  empleados: LabelFn;
  gerencias: LabelFn;
  estados: LabelFn;
  tipos?: LabelFn;
  ops?: LabelFn;
};


function Campo({ label, children, className = "", right }: { label: string; children?: ReactNode; className?: string; right?: boolean }) {
  return (
    <div className={`flex items-start gap-2 ${className}`}>
      <span className="shrink-0 pt-0.5 text-neutral-600">{label}</span>
      <div className={`min-h-5 flex-1 whitespace-pre-wrap border border-neutral-400 px-1.5 py-0.5 ${right ? "text-right" : ""}`}>{children ?? ""}</div>
    </div>
  );
}

function SeccionOP({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <section className="mt-5 break-inside-avoid">
      <h2 className="mb-2 text-[12px] font-bold uppercase text-neutral-600">{titulo}</h2>
      <div className="space-y-2.5">{children}</div>
    </section>
  );
}

function FirmasOP({ cargos }: { cargos: string[] }) {
  return (
    <div className="flex items-end gap-6">
      <div className="w-24 shrink-0 text-neutral-600">
        <div>Firmas:</div>
        <div className="mt-2">Código Empleado:</div>
      </div>
      <div className="grid flex-1 gap-6" style={{ gridTemplateColumns: `repeat(${cargos.length}, minmax(0, 1fr))` }}>
        {cargos.map((c) => (
          <div key={c} className="text-center">
            <div className="h-10 border-b border-black" />
            <div className="mt-1 text-[10px] font-bold uppercase text-neutral-700">{c}</div>
            <div className="mt-3 border-b border-dotted border-neutral-400" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function InformeOP({ op, lk }: { op: Row; ots?: Row[]; lk: Labels }) {
  return (
    <div className="informe mx-auto max-w-[190mm] bg-white p-8 font-sans text-[11px] leading-snug text-black">
      <h1 className="text-center text-xl font-bold uppercase tracking-wide">Orden de Producción</h1>
      <SeccionOP titulo="Identificación">
        <div className="grid grid-cols-2 gap-6">
          <Campo label="N° OP"><span className="font-mono">{op.numero}</span></Campo>
          <Campo label="Fecha de elaboración">{fmtDate(op.fecha)}</Campo>
        </div>
        <div className="grid grid-cols-2 gap-6">
          <Campo label="Cliente">{lk.clientes?.(op.cliente_id)}</Campo>
          <Campo label="Tipo de Producción">{lk.tipos?.(op.tipo_produccion_id)}</Campo>
        </div>
        <div className="grid grid-cols-2 gap-6">
          <Campo label="Gerencia Produ/Proyecto">{lk.gerencias(op.gerencia_id)}</Campo>
          <Campo label="Responsable">{lk.empleados(op.responsable_id)}</Campo>
        </div>
      </SeccionOP>
      <SeccionOP titulo="Información ejecutiva">
        <div className="grid grid-cols-[2fr_0.8fr_0.8fr_2.4fr] gap-3">
          <Campo label="Producto/Servicio">{op.producto}</Campo>
          <Campo label="Cant." right>{fmtNum(op.cantidad, 2)}</Campo>
          <Campo label="Unid">{op.unidad_medida}</Campo>
          <Campo label="Descripción">{op.descripcion}</Campo>
        </div>
        <div className="grid grid-cols-2 gap-6">
          <Campo label="Requisitos"><div className="min-h-16">{op.requisitos}</div></Campo>
          <div><Campo label="Especif. Técnicas">{op.especificaciones}</Campo></div>
        </div>
      </SeccionOP>
      <SeccionOP titulo="Planificación">
        <div className="grid grid-cols-3 gap-4">
          <Campo label="Fecha Planificada de Inicio" right>{fmtDate(op.fecha_inicio_plan)}</Campo>
          <Campo label="Fecha Planificada de Fin" right>{fmtDate(op.fecha_fin_plan)}</Campo>
          <Campo label="HH Planificadas" right>{fmtNum(op.hh_planificadas, 1)}</Campo>
        </div>
        <Campo label="Tiempo de entrega">{fmtTiempoEntrega(op.fecha_inicio_plan, op.fecha_fin_plan)}</Campo>
      </SeccionOP>
      <SeccionOP titulo="Autorización">
        <FirmasOP cargos={["J.P/Ger. Produ", "Gestión Producción"]} />
      </SeccionOP>
      <SeccionOP titulo="Ejecución">
        <div className="grid grid-cols-3 gap-4">
          <Campo label="Fecha Real de Inicio" right>{op.fecha_inicio_real ? fmtDate(op.fecha_inicio_real) : ""}</Campo>
          <Campo label="Fecha Real de Fin" right>{op.fecha_fin_real ? fmtDate(op.fecha_fin_real) : ""}</Campo>
          <Campo label="HH Ejecutadas" right>{op.hh_ejecutadas === null || op.hh_ejecutadas === undefined ? "" : fmtNum(op.hh_ejecutadas, 1)}</Campo>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Campo label="Desviación de HH">{fmtDesviacionHH(op.hh_planificadas, op.hh_ejecutadas)}</Campo>
          <Campo label="Desviación de fechas">{fmtDesviacionDias(op.fecha_fin_plan, op.fecha_fin_real)}</Campo>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex h-3.5 w-3.5 items-center justify-center border border-neutral-600 text-[10px] leading-none">{op.no_conformidad ? "✓" : ""}</span>
          <span className="text-neutral-600">Inconformidad</span>
        </div>
        {op.no_conformidad && op.identificacion_no_conformidad && <Campo label="Identificación">{op.identificacion_no_conformidad}</Campo>}
        <div className="pl-6">
          <Campo label="Tratamiento y Correcciones"><div className="min-h-8">{op.tratamiento}</div></Campo>
        </div>
      </SeccionOP>
      <SeccionOP titulo="Cierre OP">
        <FirmasOP cargos={["Logística", "Gestión Calidad", "Certificación", "Gestión Producción"]} />
      </SeccionOP>
    </div>
  );
}

function Check({ on, label }: { on: boolean; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="inline-flex h-3.5 w-3.5 items-center justify-center border border-neutral-600 text-[10px] leading-none">{on ? "✓" : ""}</span>
      <span className="text-neutral-600">{label}</span>
    </div>
  );
}

export function InformeOT({ ot, lk }: { ot: Row; lk: Labels }) {
  return (
    <div className="informe mx-auto max-w-[190mm] bg-white p-8 font-sans text-[11px] leading-snug text-black">
      <h1 className="text-center text-xl font-bold uppercase tracking-wide">Orden de Trabajo</h1>
      <SeccionOP titulo="Identificación">
        <div className="grid grid-cols-3 gap-4">
          <Campo label="N° OT"><span className="font-mono">{ot.numero}</span></Campo>
          <Campo label="N° OP"><span className="font-mono">{lk.ops?.(ot.op_id)}</span></Campo>
          <Campo label="Fecha Elab.">{fmtDate(ot.fecha_elaboracion)}</Campo>
        </div>
        <div className="grid grid-cols-[2fr_1fr] gap-4">
          <Campo label="Gerencia Produ/Proyecto">{lk.gerencias(ot.gerencia_id)}</Campo>
          <Campo label="Prioridad"><span className="capitalize">{ot.prioridad}</span></Campo>
        </div>
        <div className="grid grid-cols-[2fr_1fr] items-center gap-4">
          <Campo label="Responsable">{lk.empleados(ot.responsable_id)}</Campo>
          <Check on={!!ot.no_programada} label="No Programada" />
        </div>
      </SeccionOP>
      <SeccionOP titulo="Información ejecutiva">
        <Campo label="Objeto de la OT">{ot.objeto}</Campo>
        <div className="grid grid-cols-[1fr_1.4fr_0.8fr_0.8fr] items-center gap-3">
          <Check on={!!ot.depende_de_ot_id} label="Depende de otra OT" />
          <Campo label="Estado">{lk.estados(ot.estado_id)}</Campo>
          <Campo label="Cant." right>{fmtNum(ot.cantidad, 2)}</Campo>
          <Campo label="Unid">{ot.unidad_medida}</Campo>
        </div>
        <div className="grid grid-cols-2 gap-6">
          <Campo label="Especif. Técnicas"><div className="min-h-12">{ot.especificaciones}</div></Campo>
          <Campo label="Requisitos"><div className="min-h-12">{ot.requisitos}</div></Campo>
        </div>
      </SeccionOP>
      <SeccionOP titulo="Planificación">
        <div className="grid grid-cols-3 gap-4">
          <Campo label="Fecha Planificada de Inicio" right>{fmtDate(ot.fecha_inicio_plan)}</Campo>
          <Campo label="Fecha Planificada de Fin" right>{fmtDate(ot.fecha_fin_plan)}</Campo>
          <Campo label="HH Planificadas" right>{fmtNum(ot.hh_planificadas, 1)}</Campo>
        </div>
      </SeccionOP>
      <SeccionOP titulo="Autorización">
        <FirmasOP cargos={["J.P/Ger. Produ", "Gestión Producción"]} />
      </SeccionOP>
      <SeccionOP titulo="Ejecución">
        <div className="grid grid-cols-3 gap-4">
          <Campo label="Fecha Real de Inicio" right>{ot.fecha_inicio_real ? fmtDate(ot.fecha_inicio_real) : ""}</Campo>
          <Campo label="Fecha Real de Fin" right>{ot.fecha_fin_real ? fmtDate(ot.fecha_fin_real) : ""}</Campo>
          <Campo label="HH Ejecutadas" right>{ot.hh_ejecutadas === null || ot.hh_ejecutadas === undefined ? "" : fmtNum(ot.hh_ejecutadas, 1)}</Campo>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Campo label="% Desviación Fecha">{fmtDesviacionDias(ot.fecha_fin_plan, ot.fecha_fin_real)}</Campo>
          <Campo label="% Desviación HH">{fmtDesviacionHH(ot.hh_planificadas, ot.hh_ejecutadas)}</Campo>
        </div>
        <Check on={!!ot.no_conformidad} label="No Conformidad" />
        <div className="pl-6">
          <Campo label="Tratamiento y Correcciones"><div className="min-h-8">{ot.tratamiento_no_conformidad}</div></Campo>
        </div>
        <Campo label="Observaciones"><div className="min-h-8">{ot.observaciones}</div></Campo>
      </SeccionOP>
      <SeccionOP titulo="Cierre OT">
        <FirmasOP cargos={["Ger. Produ", "SMS", "SHI", "Logística"]} />
        <div className="mt-4"><FirmasOP cargos={["Gestión Calidad", "Certificación", "Gestión Producción"]} /></div>
      </SeccionOP>
    </div>
  );
}

/** Renderiza un documento oculto y lo envía a imprimir; se limpia al cerrar el diálogo de impresión. */
export function useInformePrinter() {
  const [doc, setDoc] = useState<ReactNode | null>(null);
  useEffect(() => {
    if (!doc) return;
    const done = () => setDoc(null);
    window.addEventListener("afterprint", done);
    const t = setTimeout(() => window.print(), 50);
    return () => {
      window.removeEventListener("afterprint", done);
      clearTimeout(t);
    };
  }, [doc]);
  const print = useCallback((node: ReactNode) => setDoc(node), []);
  const printArea = <div className="print-area">{doc}</div>;
  return { print, printArea };
}
