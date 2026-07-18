# flashcard2026

A multi-stage-reveal flashcard app for learning Chinese vocabulary. Instead of a single flip, each card reveals its fields one at a time in an order you configure per deck (default: English → pinyin → Chinese).

## Status
- **Frontend:** complete, deployed on Vercel.
- **Backend (accounts + sync):** designed, not yet built. See `docs/spec.md` → Backend for the full design.

## Architecture
- **Frontend:** React + TypeScript, built with Vite, hosted on Vercel.
- **Storage:** browser-local IndexedDB for guests (built). Signed-in accounts will be backed by Supabase (Postgres + Auth) — planned, not yet wired up.
- **No app server.** The browser talks directly to Supabase's auto-generated API; access control is enforced by Postgres row-level security instead of a server-side auth layer. There's nothing else to deploy or host beyond the frontend and the Supabase project.

```
Browser (React app on Vercel)  ──►  Supabase (Postgres + Auth, RLS-enforced)
```

## Getting started
```
npm install
npm run dev      # localhost:5173
npm run build    # type-check + production build
```

## Docs
- `CLAUDE.md` — operational reference for AI-assisted development (commands, invariants, structure).
- `docs/spec.md` — the actual design spec: data model, practice logic, UI flow, backend schema, and what's intentionally deferred.
