# Project memory

## Product intent & audience

- Web app built with Vite + React, using TanStack Router/Start.
- Includes database layer via Drizzle ORM (`drizzle/` directory).
- Has project reference docs: `AGENTS.md`, `roadmap.md`.

## Brand personality & voice

- Assistant communicates with user in Spanish.

## Visual design & UX direction

- No direct UI details inferred yet. App contains screens, forms, and UI components (structure lost this turn).

## Decisions, constraints & rationale

- Stack: Vite + React + TanStack Router/Start + Drizzle ORM + TypeScript.
- Config files present: `vite.config.ts`, `tsconfig.json`, `package.json`.
- Router entry point expected at `src/` (Vite resolves `router` entry from `/home/project/src`).
- `src/` directory was missing, causing dev server/preview failure; recovery must come from Bolt version history, not manual rebuild.

## Open questions & assumptions

- App screens, components, and business logic unknown until `src/` is restored.
- No `.bolt/prompt` provided; no explicit global instructions to follow.
- Specific Drizzle schema details and DB target not yet inspected.