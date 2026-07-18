# CLAUDE.md

This file is operational context for Claude Code — commands, structure, and hard invariants only. It intentionally does not restate the design: for schema, algorithms, UI behavior, and rationale, see `docs/spec.md`, which is the single source of truth. If this file and spec.md ever disagree, spec.md wins — fix this file to match, don't fork the detail across both.

## Project
A multi-stage-reveal flashcard web app for learning Chinese vocabulary. Each card reveals in ordered stages (default English → pinyin → Chinese) instead of a single front/back flip. Web first; a mobile app may follow and must share the same data model.

## Status
- **Frontend (v1): complete and building cleanly.** Structured card/deck model, IndexedDB storage, deck list (practice/edit modes), deck + card CRUD, multi-stage reveal practice with shuffle and correct back behavior.
- **Backend (accounts + sync): designed, not yet implemented.** Full design in `docs/spec.md` → Backend. No Supabase project, tables, RPC, or auth screen exist in this repo yet — don't assume any backend file (`supabase/`, migrations, auth UI) is present until this line says otherwise.

## Tech stack
- **Frontend:** React, TypeScript, Vite.
- **Storage:** IndexedDB for guests (built); Supabase Postgres + Auth for signed-in accounts (designed, not built) — see spec.md → Backend.

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
Backend commands (Supabase CLI, migrations, etc.) will be added here once the backend is scaffolded.

## Structure
```
flashcard2026/
├── index.html
├── vite.config.ts
├── tsconfig.json
├── src/
│   ├── main.tsx          # entry point
│   ├── App.tsx           # root component; owns screen state + decks state
│   ├── index.css         # all styles (no CSS modules)
│   ├── types.ts          # Card, Deck, SRS interfaces
│   ├── db.ts             # storage interface: getAllDecks, saveDeck, deleteDeck.
│   │                      # Currently IndexedDB only (= localStore). Will grow a
│   │                      # Supabase-backed remoteStore — see spec.md → Backend.
│   ├── utils.ts          # generateId, shuffle (Fisher-Yates)
│   └── components/
│       ├── Home.tsx          # two-button home screen
│       ├── DeckList.tsx      # deck list, parameterized by mode (practice|edit)
│       ├── DeckEditor.tsx    # edit cards in a deck; rename/delete deck
│       ├── CardEditor.tsx    # add/edit a single card
│       ├── PracticeSession.tsx  # multi-stage reveal session
│       └── ConfirmDialog.tsx # reusable in-app confirmation modal
└── docs/
    └── spec.md
```
No backend directory exists yet (no `supabase/`, no server code, no auth screen component). Update this tree once any of that is scaffolded — don't let it drift into aspirational documentation.

## v1 scope vs. later
- **Implemented:** everything under Frontend in Status above.
- **Designed, not yet built:** accounts + sync backend — see spec.md → Backend.
- **Reserved for later, do NOT build yet:** SRS scheduling, graded review, extra reveal faces, OAuth sign-in, native mobile app, cross-deck cards. Full list + rationale: spec.md → Reserved for later.

## Conventions
- All styles in `src/index.css` — no CSS modules, no inline styles.
- Components are named exports (not default exports).
- Navigation state lives entirely in `App.tsx` as a discriminated union (`Screen` type); components receive callbacks, not `setScreen`.
- All deck mutations go through `App.tsx` (`handleSaveDeck`, `handleDeleteDeck`), which keep state and storage in sync.
- No `any` — use `keyof Card` or explicit type guards when indexing card fields by string (e.g. in PracticeSession).
- Never use `window.confirm` — use `<ConfirmDialog>` for all destructive confirmations so the prompt matches the app's visual style.
