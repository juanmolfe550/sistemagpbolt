import { useState } from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { db, useLookup, type Row } from "@/lib/data";
import { PRIORIDADES, type Field, type LookupTable } from "@/lib/entities";

const NONE = "";

function RefSelect({ table, value, onChange, filter }: { table: LookupTable; value: any; onChange: (v: any) => void; filter?: ((r: Row) => boolean) | undefined }) {
  const { rows, map } = useLookup(table);
  const allowed = filter ? new Set(rows.filter(filter).map((r) => r.id)) : null;
  return (
    <select
      className="h-9 w-full rounded-md border border-input bg-card px-2 text-sm"
      value={value ?? NONE}
      onChange={(e) => onChange(e.target.value === NONE ? null : Number(e.target.value))}
    >
      <option value={NONE}>— Seleccionar —</option>
      {[...map.entries()].filter(([id]) => !allowed || allowed.has(id)).map(([id, label]) => (
        <option key={id} value={id}>
          {label}
        </option>
      ))}
    </select>
  );
}

function FieldInput({ f, value, values, onChange }: { f: Field; value: any; values: Row; onChange: (v: any) => void }) {
  switch (f.type) {
    case "calc": {
      const txt = f.calc?.(values) ?? "—";
      return (
        <div className={`flex h-9 items-center rounded-md border border-dashed border-input bg-muted/40 px-3 font-code text-sm ${txt.startsWith("Error") ? "text-destructive" : ""}`}>
          {txt}
        </div>
      );
    }
    case "textarea":
      return <Textarea rows={3} value={value ?? ""} onChange={(e) => onChange(e.target.value)} />;
    case "number":
      return (
        <Input type="number" step="any" value={value ?? ""} onChange={(e) => onChange(e.target.value === "" ? null : Number(e.target.value))} />
      );
    case "date":
      return <Input type="date" value={value ? String(value).slice(0, 10) : ""} onChange={(e) => onChange(e.target.value || null)} />;
    case "bool":
      return (
        <div className="flex h-9 items-center">
          <Switch checked={!!value} onCheckedChange={onChange} />
        </div>
      );
    case "select":
      return (
        <RefSelect
          table={f.ref!}
          value={value}
          onChange={onChange}
          filter={f.name === "depende_de_ot_id" ? (r) => r.op_id === values.op_id && r.id !== values.id : undefined}
        />
      );
    case "prioridad":
      return (
        <select
          className="h-9 w-full rounded-md border border-input bg-card px-2 text-sm capitalize"
          value={value ?? NONE}
          onChange={(e) => onChange(e.target.value || null)}
        >
          <option value={NONE}>—</option>
          {[...new Set([...PRIORIDADES, ...(value ? [value] : [])])].map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
      );
    default:
      return <Input value={value ?? ""} onChange={(e) => onChange(e.target.value)} />;
  }
}

type Props = {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  table: string;
  title: string;
  fields: Field[];
  initial?: Row | null;
  defaults?: Row;
  onSaved: () => void;
};

export function EntityForm({ open, onOpenChange, table, title, fields, initial, defaults, onSaved }: Props) {
  const [values, setValues] = useState<Row>({});
  const [saving, setSaving] = useState(false);
  const [lastKey, setLastKey] = useState<string>("");
  const key = `${open}-${initial?.id ?? "new"}`;
  if (key !== lastKey) {
    setLastKey(key);
    setValues(initial ? { ...initial } : { activo: true, ...(defaults ?? {}) });
  }

  const gerencias = useLookup("gerencias");
  const autoResp = fields.some((f) => f.name === "responsable_id") && fields.some((f) => f.name === "gerencia_id" && f.ref === "gerencias");

  function change(name: string, v: any) {
    if (name === "gerencia_id" && autoResp && v !== values.gerencia_id) {
      const vigente = gerencias.rows.find((g) => g.id === v)?.responsable_id ?? null;
      if (vigente && vigente !== values.responsable_id) {
        const existente = !!initial && !!values.responsable_id;
        if (!existente || window.confirm("Cambió la gerencia/proyecto. ¿Sustituir el responsable por el responsable vigente de la nueva gerencia?")) {
          setValues((s: Row) => ({ ...s, gerencia_id: v, responsable_id: vigente }));
          return;
        }
      }
    }
    setValues((s: Row) => ({ ...s, [name]: v }));
  }

  const groups = [...new Set(fields.map((f) => f.group ?? "Datos"))];

  async function save() {
    for (const f of fields) {
      if (f.required && (values[f.name] === null || values[f.name] === undefined || values[f.name] === "")) {
        toast.error(`Falta el campo: ${f.label}`);
        return;
      }
    }
    if (values.fecha_inicio_plan && values.fecha_fin_plan && String(values.fecha_fin_plan) < String(values.fecha_inicio_plan)) {
      toast.error("La fecha fin planificada no puede ser anterior a la fecha de inicio planificada");
      return;
    }
    setSaving(true);
    const payload: Row = {};
    fields.filter((f) => f.type !== "calc").forEach((f) => (payload[f.name] = values[f.name] === "" ? null : values[f.name]));
    const res = initial ? await db(table).update(payload).eq("id", initial.id) : await db(table).insert(payload);
    setSaving(false);
    if (res.error) {
      toast.error(res.error.code === "23505" ? "Ese número ya existe" : res.error.message);
      return;
    }
    toast.success("Guardado");
    onSaved();
    onOpenChange(false);
  }

  const grid = (list: Field[]) => (
    <div className="grid gap-4 sm:grid-cols-2">
      {list.map((f) => (
        <div key={f.name} className={f.type === "textarea" ? "space-y-1.5 sm:col-span-2" : "space-y-1.5"}>
          <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {f.label}
            {f.required && <span className="text-destructive"> *</span>}
          </Label>
          <FieldInput f={f} value={values[f.name]} values={values} onChange={(v) => change(f.name, v)} />
        </div>
      ))}
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        {groups.length > 1 ? (
          <Tabs defaultValue={groups[0] ?? "Datos"}>
            <TabsList>
              {groups.map((g) => (
                <TabsTrigger key={g} value={g}>
                  {g}
                </TabsTrigger>
              ))}
            </TabsList>
            {groups.map((g) => (
              <TabsContent key={g} value={g} className="pt-3">
                {grid(fields.filter((f) => (f.group ?? "Datos") === g))}
              </TabsContent>
            ))}
          </Tabs>
        ) : (
          grid(fields)
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={save} disabled={saving}>
            {saving ? "Guardando…" : "Guardar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
