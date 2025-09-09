# Repository Guidelines

## Project Structure & Module Organization
- `client/`: React + Vite app (entry `client/src/main.tsx`, pages in `client/src/pages`, reusable UI in `client/src/components`).
- `server/`: Express API and dev server glue (`index.ts`, `routes.ts`, Supabase integration in `supabase-*.ts`). Builds to `dist/server/`.
- `shared/`: Cross‑shared types and schema (e.g., `schema.ts`).
- `api/`: Azure/Vercel function-style handlers (used for cloud deployments).
- `dist/`: Build output. Do not edit.
- `supabase/`, `*.sql`: Auth/storage policies and migrations.

## Build, Test, and Development Commands
- `npm run dev`: Start the TypeScript server in dev; mounts Vite for the client.
- `npm run build`: Build client (`vite`) and server (`esbuild`) bundles.
- `npm start`: Run production server (`azure-server.js`).
- `npm run check`: Type-check the monorepo with `tsc`.
- `npm run db:push`: Apply Drizzle schema changes.
- Cloud: `npm run azure:start` (Azure port 8080), `npm run vercel-build`.

## Coding Style & Naming Conventions
- TypeScript + ESM modules; strict mode enabled. Prefer named exports.
- Indentation: 2 spaces; Prettier not enforced—match existing style.
- React: components in PascalCase (`BudgetChart.tsx`); hooks camelCase.
- Paths: use aliases `@/*` (client) and `@shared/*` per `tsconfig.json`.
- Files: server code `.ts`; client UI `.tsx` under `client/src`.

## Testing Guidelines
- No test runner is configured. Use `npm run check` for types.
- If adding tests, place files as `**/*.test.ts(x)` and keep unit tests close to sources.
- Prefer deterministic tests; mock Supabase/network boundaries.

## Commit & Pull Request Guidelines
- Commits follow Conventional Commits seen in history: `feat: ...`, `fix: ...`.
- PRs: include a clear summary, rationale, and screenshots for UI changes.
- Link issues, describe migration/SQL impacts, and include manual test steps.

## Security & Configuration Tips
- Store secrets in `.env.local`; never commit real keys. See `.env.example` and `.env.supabase.example`.
- Review Supabase RLS and storage policies when touching `*.sql` or `supabase/*`.
- Validate that `npm run build` and `npm start` work before merging.
