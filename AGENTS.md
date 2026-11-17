<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Project rules
- Data access uses the browser client with RLS (`src/lib/data.ts`); write permission is enforced in the database via `is_editor()` / `has_role()`, not in the UI. Why: roles must not be bypassable client-side.
- Form fields for every table are declared in `src/lib/entities.ts` and rendered by the generic `EntityForm`. Why: one place to add or change a field.
- Authenticated pages live under the pathless `_app` layout, which redirects signed-out users to `/login`.
- Los documentos impresos oficiales (informes OP/OT con firmas) viven en src/components/informes.tsx y se imprimen con useInformePrinter + .print-area (styles.css); la impresión de pantalla completa no se usa. Why: el usuario distingue formulario (gestión en pantalla) de informe (documento firmado).
- Business calculations (HH deviation, date deviation, working-day lead time) are stored as DB generated columns and mirrored in `src/lib/calculos.ts` for live form display; form fields of type `calc` are read-only and never saved. Why: reports read persisted values and users cannot contradict the rules.
- Orders store their own `responsable_id`; the gerencia's `responsable_id` is only a default copied on selection, and changes are logged by trigger in `historial_responsable`. Why: historical orders must keep their assignee.
- Shop-floor progress (pieces/HH/stops) is logged as rows in `ot_bitacora`; a DB trigger accumulates them into the OT (cantidad_ejecutada, hh_ejecutadas, avance). Why: auditable history and totals the UI cannot skew.
- Las OT del Líder de Proyecto nacen en Creada y su plan se congela al someterlo (firma PLAN-...); solo los editores reabren vía reabrir_planificacion(). Why: segregación planificación/liberación.
