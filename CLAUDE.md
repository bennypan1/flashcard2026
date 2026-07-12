# CLAUDE.md

Full design detail lives in `docs/spec.md`.

## Project
A multi-stage-reveal flashcard web app for learning Chinese vocabulary. Each card reveals in ordered stages (default English → pinyin → Chinese character) instead of a single front/back flip. Web first; a mobile app may follow and must share the same data model.

## Status
v1 complete and building cleanly. All spec requirements implemented: structured card/deck model, IndexedDB storage, deck list (practice/edit modes), deck + card CRUD, multi-stage reveal practice with shuffle and correct back behavior.

## Tech stack
- **Frontend:** React, DOM web app.
- **Storage (v1):** browser-local IndexedDB. No backend.
- **Language:** TypeScript.

## Core design rules (do not violate)
1. **Cards are structured objects, never delimited strings.** Store each field (`english`, `pinyin`, `chinese`, …) separately; never pack fields into one string and parse them apart. Fields may contain spaces.
2. **Stable unique `id` on every card and deck.** Identify by `id`, never by array index — order changes via shuffle/edit/delete.
3. **Stored decks are the source of truth and immutable during practice.** Practice runs on a *session* built over a deck; never shuffle or mutate the stored deck in place.
4. **`revealOrder` drives the reveal — no hard-coded "3 stages."** The reveal walks the deck's `revealOrder` list, so order is per-deck configurable and new faces can be appended without touching reveal logic.
5. **"Back" is the exact inverse of "forward."** Stepping back onto a previous card shows it *fully revealed*, not reset to its first face.

## Data model (summary — see spec for the annotated version)
Cards are **nested inside decks** (each deck owns its card list; one deck is practiced at a time).

- **Card:** `{ id, english, pinyin, chinese, notes?, createdAt, lastReviewed, srs: { nextDue, interval, ease } }`
- **Deck:** `{ id, name, revealOrder, cards[], createdAt, lastPracticed }`

`srs` fields are **reserved and unused in v1** — present now so spaced repetition can be added later with no data migration.

## Practice model (v1 = pure review)
- Session state: shuffled list of card `id`s + current card index + current reveal stage.
- Stage `s` (`0 .. L-1`, where `L = revealOrder.length`) shows faces `revealOrder[0..s]`.
- Controls: click / spacebar / → = advance; ← = go back. Ends on a "Done" state after the last face of the last card.
- **Forward:** reveal next face; at the last face, go to next card at stage 0; at the last card, finish.
- **Back:** hide last-revealed face; at stage 0, go to previous card *fully revealed*; at the very start, no-op.
- Shuffle with Fisher–Yates over card ids. Never shuffle the stored deck.

## UI (two-button home flow)
- **Home:** two buttons — Start, Edit Decks.
- **Deck list:** one component parameterized by mode (`practice` | `edit`) — same screen for both, distinct header per mode. Start → practice mode (tap a deck to begin a session). Edit Decks → edit mode (add/delete decks; tap a deck to open its editor).
- **Deck editor:** sticky header with deck name + action buttons (Add Card, Delete Deck). Always-visible square checkboxes on each card; once any card is checked, toolbar switches to Delete (N) / Cancel. Tap a card (when nothing checked) to edit it; tap anywhere on a card (when something is checked) to toggle its checkbox.
- **Practice session:** multi-stage reveal screen. Cards with notes show a 📝 Note button (outside the tap-to-advance area); tapping opens an always-editable textarea; Save is disabled until the note changes.

## v1 scope vs. later
**Implemented (v1):** structured card/deck model with stable ids + timestamps, browser storage, deck list (practice/edit modes), deck + card editing, pure-review practice with multi-stage reveal and shuffle.

**Reserved for later — do NOT build, but keep data compatible:**
- Spaced repetition scheduling (SM-2 or FSRS) using the reserved `srs` fields + `lastReviewed`.
- Graded review ("knew it / didn't know") feeding the scheduler.
- Extra faces (example sentence, audio) via `revealOrder`.
- Accounts, multi-device sync, native/mobile app (hosted backend, e.g. Firestore/Supabase).
- Cross-deck cards (would move from nested cards to a shared card pool with `deckId` references).

## Commands
```
npm install   # install dependencies
npm run dev   # dev server (Vite, localhost:5173)
npm run build # tsc type-check + Vite production build → dist/
npm run preview # preview production build locally
```

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
│   ├── db.ts             # IndexedDB wrapper (getAllDecks, saveDeck, deleteDeck)
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

## Conventions
- Keep the stored data shape stable and migration-friendly (ids, timestamps, clean schema) so it can lift into a hosted backend later without a rewrite.
- All styles in `src/index.css` — no CSS modules, no inline styles.
- Components are named exports (not default exports).
- Navigation state lives entirely in `App.tsx` as a discriminated union (`Screen` type); components receive callbacks, not `setScreen`.
- All deck mutations go through `App.tsx` (`handleSaveDeck`, `handleDeleteDeck`) which keep state and IndexedDB in sync.
- No `any` — use `keyof Card` or explicit type guards when indexing card fields by string (e.g. in PracticeSession).
- Never use `window.confirm` — use `<ConfirmDialog>` for all destructive confirmations so the prompt matches the app's visual style.
