# CLAUDE.md

This file is operational context for Claude Code — commands, structure, and hard invariants only. It intentionally does not restate the design: for schema, algorithms, UI behavior, and rationale, see `docs/spec.md`, which is the single source of truth. If this file and spec.md ever disagree, spec.md wins — fix this file to match, don't fork the detail across both.

## Project
A multi-stage-reveal flashcard web app for learning Chinese vocabulary. Each card reveals in ordered stages (default English → pinyin → Chinese) instead of a single front/back flip. Web first; a mobile app may follow and must share the same data model.

## Status
- **Frontend (v1): complete.** Structured card/deck model, IndexedDB storage, deck list (practice/edit modes), deck + card CRUD, multi-stage reveal practice with shuffle and correct back behavior.
- **`npm run build` currently fails, expectedly.** `tsc` reports three TS6133 "declared but never read" errors in `db.ts` — `supabase`, `rowToCard`, `rowToDeck`. That is the scaffold below being declared before anything consumes it, not a regression; implementing `remoteStore` uses all three identifiers and clears the errors. Do not silence them with underscores or `@ts-ignore`. `npm run dev` is unaffected — Vite does not type-check.
- **Backend (accounts + sync): client wired, `remoteStore` scaffolded but not implemented.** Full design in `docs/spec.md` → Backend.
  - **Exists:** a live Supabase project with `supabase/migrations/20260801000000_init_backend.sql` applied (tables, RLS policies, `save_deck` RPC) as of 2026-08-30; the repo is linked to it via the Supabase CLI (`supabase/.temp/`, gitignored). The `@supabase/supabase-js` dependency, `src/supabase.ts` (the client), and a local `.env.local`. The `db.ts` storage seam — `StorageBackend` interface, `localStore` (live), `setActiveStore()`. And the `remoteStore` scaffold: `CardRow`/`DeckRow` interfaces describing rows as Postgres returns them (snake_case keys, ISO-8601 timestamps), plus `rowToCard`/`rowToDeck` mappers and all three methods — every one a stub calling `notImplemented()`.
  - **Does not exist:** any working `remoteStore` body, an auth screen, and the first-sign-up local→remote import prompt.
  - `App.tsx` hard-codes `const signedIn = false`, so every user is still a guest on `localStore`. `remoteStore` is unreachable at runtime.

## Tech stack
- **Frontend:** React, TypeScript, Vite.
- **Storage:** IndexedDB for guests (built); Supabase Postgres + Auth for signed-in accounts (database live and client wired; `remoteStore` still throws) — see spec.md → Backend.

## Hard invariants (do not violate — see spec.md for the "why")
1. Cards are structured objects, never delimited strings — one field per property. (spec → Data model)
2. Every card and deck has a stable, unique `id`; never identify by array index. (spec → Data model)
3. Stored decks (local or remote) are the source of truth and immutable during practice; practice runs on a session built over them. (spec → Practice model)
4. `revealOrder` drives the reveal — never hard-code a stage count. (spec → revealOrder)
5. Back is the exact inverse of forward — stepping back shows the previous card fully revealed, not reset. (spec → Practice model)
6. Guest data has no durability guarantee — only signed-in accounts are persisted by the backend. (spec → Foundational rules, Backend)
7. Components never call IndexedDB or Supabase directly — only through `db.ts`'s exported functions. (spec → Backend → Storage interface)

## Commands
```
npm install     # install dependencies
npm run dev     # dev server (Vite, localhost:5173)
npm run build   # tsc type-check + Vite production build → dist/
npm run preview # preview production build locally
```
Backend (Supabase CLI — project setup, applying migrations, auth settings): see `supabase/README.md`. There are no npm scripts for it. The project is created and linked; apply new migrations with `supabase db push` and check applied state with `supabase migration list`.

**`.env.local` is required to run the app.** `src/supabase.ts` throws at import time unless `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` are both set, and `db.ts` imports it unconditionally — so without the file the app crashes on load in the browser (the build is unaffected; the throw is runtime). It is gitignored via `*.local`, so a fresh clone must recreate it from the Supabase dashboard → Project Settings → API.

**Migrations are append-only.** `20260801000000_init_backend.sql` has been applied to the live database — never edit it. Schema changes go in a new file with a later timestamp.

## Structure
```
flashcard2026/
├── index.html
├── vite.config.ts
├── tsconfig.json
├── .env.local            # gitignored; VITE_SUPABASE_URL + VITE_SUPABASE_PUBLISHABLE_KEY
├── src/
│   ├── main.tsx          # entry point
│   ├── App.tsx           # root component; owns screen state + decks state
│   ├── index.css         # all styles (no CSS modules)
│   ├── types.ts          # Card, Deck, SRS interfaces
│   ├── supabase.ts       # the Supabase client, created from .env.local
│   ├── db.ts             # storage interface: getAllDecks, saveDeck, deleteDeck,
│   │                      # delegating to the active StorageBackend. localStore
│   │                      # (IndexedDB) is live; remoteStore is scaffolded —
│   │                      # row types + mapper/method stubs that all throw.
│   ├── utils.ts          # generateId, shuffle (Fisher-Yates)
│   └── components/
│       ├── Home.tsx          # two-button home screen
│       ├── DeckList.tsx      # deck list, parameterized by mode (practice|edit)
│       ├── DeckEditor.tsx    # edit cards in a deck; rename/delete deck
│       ├── CardEditor.tsx    # add/edit a single card
│       ├── PracticeSession.tsx  # multi-stage reveal session
│       └── ConfirmDialog.tsx # reusable in-app confirmation modal
├── supabase/
│   ├── README.md         # project setup, applying migrations, auth settings
│   └── migrations/
│       └── 20260801000000_init_backend.sql  # decks/cards tables, RLS, save_deck RPC
└── docs/
    └── spec.md
```
There is still no server code and no auth screen component — `supabase/` is SQL only. `db.ts` now imports the client from `src/supabase.ts`, but every `remoteStore` method still throws, so nothing reaches the network at runtime. Update this tree as that changes; don't let it drift into aspirational documentation.

## v1 scope vs. later
- **Implemented:** everything under Frontend in Status above.
- **Partially built:** accounts + sync backend — SQL schema, the Supabase client, and the `db.ts` seam (including the `remoteStore` scaffold) exist; the `remoteStore` implementation and auth UI do not. See Status above and spec.md → Backend.
- **Reserved for later, do NOT build yet:** SRS scheduling, graded review, extra reveal faces, OAuth sign-in, native mobile app, cross-deck cards. Full list + rationale: spec.md → Reserved for later.

## Conventions
- All styles in `src/index.css` — no CSS modules, no inline styles.
- Components are named exports (not default exports).
- Navigation state lives entirely in `App.tsx` as a discriminated union (`Screen` type); components receive callbacks, not `setScreen`.
- All deck mutations go through `App.tsx` (`handleSaveDeck`, `handleDeleteDeck`), which keep state and storage in sync.
- No `any` — use `keyof Card` or explicit type guards when indexing card fields by string (e.g. in PracticeSession).
- Never use `window.confirm` — use `<ConfirmDialog>` for all destructive confirmations so the prompt matches the app's visual style.
