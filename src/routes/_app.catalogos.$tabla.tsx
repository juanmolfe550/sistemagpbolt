import { createFileRoute, notFound } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Pencil, Trash2, Search } from "lucide-react";
import { toast } from "sonner";
import { CATALOGOS, type Field } from "@/lib/entities";
import { db, useInvalidate, useLookup, useRows, type Row } from "@/lib/data";
import { useAuth } from "@/lib/auth";
import { EntityForm } from "@/components/EntityForm";
import { PageHeader } from "@/components/ui-bits";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export const Route = createFileRoute("/_app/catalogos/$tabla")({
  loader: ({ params }) => {
    const c = CATALOGOS[params.tabla];
    if (!c) throw notFound();
    return { title: c.title };
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: `${loaderData?.title ?? "Catálogo"} — Gestión de Producción` },
      { name: "description", content: `Catálogo de ${loaderData?.title ?? ""}` },
      { property: "og:title", content: `${loaderData?.title ?? "Catálogo"} — Gestión de Producción` },
      { property: "og:description", content: `Catálogo de ${loaderData?.title ?? ""}` },
    ],
  }),
  component: CatalogoPage,
});

function Cell({ f, row }: { f: Field; row: Row }) {
  const lk = useLookup(f.ref ?? "gerencias");
  const v = row[f.name];
  if (f.type === "bool") return <span className={v ? "text-success" : "text-muted-foreground"}>{v ? "Sí" : "No"}</span>;
  if (f.type === "select") return <>{lk.label(v)}</>;
  return <>{v ?? "—"}</>;
}

function CatalogoPage() {
  const { tabla } = Route.useParams();
  const cat = CATALOGOS[tabla]!;
  const { canEdit } = useAuth();
  const { data = [], isLoading } = useRows(cat.table, cat.order);
  const invalidate = useInvalidate();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Row | null>(null);
  const [q, setQ] = useState("");
  const cols = cat.fields.filter((f) => f.list);
  const rows = data.filter((r) => !q || JSON.stringify(r).toLowerCase().includes(q.toLowerCase()));

  async function remove(r: Row) {
    if (!confirm("¿Eliminar este registro?")) return;
    const { error } = await db(cat.table).delete().eq("id", r.id);
    if (error) toast.error(error.code === "23503" ? "No se puede eliminar: está siendo usado en órdenes" : error.message);
    else {
      toast.success("Eliminado");
      invalidate(cat.table);
    }
  }

  return (
    <div>
      <PageHeader title={cat.title} code="Catálogo">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input className="w-56 pl-8" placeholder="Buscar…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        {canEdit && (
          <Button
            onClick={() => {
              setEditing(null);
              setOpen(true);
            }}
          >
            <Plus className="h-4 w-4" /> Nuevo
          </Button>
        )}
      </PageHeader>
      <div className="rounded-lg border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              {cols.map((c) => (
                <TableHead key={c.name}>{c.label}</TableHead>
              ))}
              {canEdit && <TableHead className="w-24" />}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell colSpan={cols.length + 1} className="text-muted-foreground">Cargando…</TableCell>
              </TableRow>
            )}
            {!isLoading && rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={cols.length + 1} className="text-muted-foreground">Sin registros</TableCell>
              </TableRow>
            )}
            {rows.map((r) => (
              <TableRow key={r.id}>
                {cols.map((c) => (
                  <TableCell key={c.name}>
                    <Cell f={c} row={r} />
                  </TableCell>
                ))}
                {canEdit && (
                  <TableCell className="text-right">
                    <Button size="icon" variant="ghost" onClick={() => { setEditing(r); setOpen(true); }}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => remove(r)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <EntityForm
        open={open}
        onOpenChange={setOpen}
        table={cat.table}
        title={editing ? `Editar ${cat.singular}` : `Nuevo ${cat.singular}`}
        fields={cat.fields}
        initial={editing}
        onSaved={() => invalidate(cat.table)}
      />
    </div>
  );
}
