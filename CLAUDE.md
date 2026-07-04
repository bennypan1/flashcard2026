# CLAUDE.md

Project memory for an LLM/assistant working in this repo. Keep it concise and up to date — it's loaded as context every session. Full design detail lives in `docs/spec.md`.

## Project
A multi-stage-reveal flashcard web app for learning Chinese vocabulary. Each card reveals in ordered stages (default English → pinyin → Chinese character) instead of a single front/back flip. Web first; a mobile app may follow and must share the same data model.

## Status
Greenfield — no code scaffolded yet. Design is settled (see `docs/spec.md`); next step is initial project setup. Update the **Commands** and **Structure** sections below once scaffolding exists.

## Tech stack
- **Frontend:** DOM web app, React. (Not a canvas/ProcessingJS app — an earlier prototype drew to a canvas; only its *interaction model* carries over.)
- **Storage (v1):** browser-local, **IndexedDB** preferred (localStorage only if data stays small). No backend.
- **Language:** JavaScript/TypeScript (TS preferred for typed card/deck schemas).

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
- Session state: shuffled list of card `id`s + current card index + current reveal stage. Never writes back to the deck.
- Stage `s` (`0 .. L-1`, where `L = revealOrder.length`) shows faces `revealOrder[0..s]`.
- Controls: click / spacebar / → = advance; ← = go back. Ends on a "Done" state after the last face of the last card.
- **Forward:** reveal next face; at the last face, go to next card at stage 0; at the last card, finish.
- **Back:** hide last-revealed face; at stage 0, go to previous card *fully revealed*; at the very start, no-op.
- Shuffle the session order with Fisher–Yates over card ids (simple temp-swap). Never shuffle the stored deck.

## UI (two-button home flow)
- **Home:** two buttons — Start, Edit Decks.
- **Deck list:** one component parameterized by mode (`practice` | `edit`) — same screen for both, distinct header per mode. Start → practice mode (tap a deck to begin a session). Edit Decks → edit mode (add/delete decks; tap a deck to open its editor).
- **Deck editor:** list / add / edit / delete cards; rename or delete the deck.
- **Practice session:** the multi-stage reveal screen.

## v1 scope vs. later
**Build now (v1):** structured card/deck model with stable ids + timestamps, browser storage, deck list (practice/edit modes), deck + card editing, pure-review practice with multi-stage reveal and shuffle.

**Reserved for later — do NOT build in v1, but keep data compatible:**
- Spaced repetition scheduling (SM-2 or FSRS) using the reserved `srs` fields + `lastReviewed`.
- Graded review ("knew it / didn't know") feeding the scheduler.
- Extra faces (example sentence, audio) via `revealOrder`.
- Accounts, multi-device sync, native/mobile app (hosted backend, e.g. Firestore/Supabase).
- Cross-deck cards (would move from nested cards to a shared card pool with `deckId` references).

## Commands
_TBD — fill in once scaffolded (install, dev server, build, test, lint)._

## Structure
_TBD — document the folder layout here once it exists._

## Conventions
- Keep the stored data shape stable and migration-friendly (ids, timestamps, clean schema) so it can lift into a hosted backend later without a rewrite.
- _Add code-style / naming / component conventions here as they're established._
