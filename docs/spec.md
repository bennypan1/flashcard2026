# Flashcard App — Project Specification

## Terminology
- **Card** — one flashcard. Holds structured fields (see schema).
- **Deck** — a named collection of cards; the unit a user practices at a time.
- **Face / stage** — one reveal step of a card. A card is revealed one face at a time in a defined order.
- **Session** — one practice run over a single deck. (Not to be confused with an *auth session*, i.e. being logged in — see Backend.)
- **Guest** — a user who hasn't signed up or logged in. Uses local, browser-only storage; see Backend.
- **Account** — a signed-up user, authenticated via Supabase. Decks are stored remotely and synced across devices; see Backend.

## Data model

### Foundational rules
1. **Cards are structured objects, never delimited strings.** Each field is stored on its own. Do not encode multiple fields into one string and parse them apart — fields may contain spaces or arbitrary text.
2. **Every card and every deck has a stable, unique `id`.** Identify cards and decks by `id`, never by array position. Order changes (shuffle, edits, deletes), so an index is not a reliable handle.
3. **Stored decks are the source of truth and are immutable during practice.** Practice happens on a *session* built on top of a deck; it never mutates the stored deck (no in-place shuffling of stored data).
4. **Guest data is not durable.** Only signed-in accounts are persisted by the backend. Local-only storage for guests can be lost at any time (cleared browsing data, new device, etc.) — never present it as saved or backed up in the UI.

### Card
Concrete example (annotated):

```json
{
  "id": "card_a1b2c3",         // stable unique id
  "english": "hello",          // meaning
  "pinyin": "nǐ hǎo",          // pronunciation (may contain spaces)
  "chinese": "你好",            // written character(s)
  "notes": "",                 // optional: example sentence, mnemonic, etc.
  "createdAt": 1710000000000,  // timestamp
  "lastReviewed": null,        // timestamp of last time seen in practice, or null

  // Reserved for spaced repetition — present but UNUSED in v1 (see Reserved for later)
  "srs": {
    "nextDue": null,           // timestamp when the card is next due
    "interval": 0,             // current interval in days
    "ease": 2.5                // ease factor
  }
}
```

### Deck
Cards are **nested inside the deck** (each deck owns its list of card objects). Practice runs over one deck, which maps directly onto a single list of cards.

```json
{
  "id": "deck_x9y8z7",
  "name": "HSK 1 — Greetings",
  "revealOrder": ["english", "pinyin", "chinese"],  // ordered face sequence for this deck
  "cards": [ /* array of Card objects */ ],
  "createdAt": 1710000000000,
  "lastPracticed": null        // timestamp of last practice session, or null
}
```

This is the shape every component works with, regardless of what's storing it underneath (see Backend) — a guest's local deck and an account's remote deck are the same `Deck` object as far as the UI is concerned.

### revealOrder
Each deck defines `revealOrder`: an ordered list of card field names to reveal, one per stage. Default `["english", "pinyin", "chinese"]`. This replaces any hard-coded "three stages" logic — the reveal walks this list, so:
- The order can be changed per deck (e.g. `["chinese", "pinyin", "english"]` for recognition practice).
- A future face (e.g. an example sentence or audio) can be added by appending a field name, with no change to reveal logic.

## Practice / interaction model (v1: pure review)

v1 is **pure review**: the learner flips through cards and moves on, with no self-grading. (Grading + scheduling is reserved for later — see SRS.)

### Session state
A session is built on top of the immutable deck and holds:
- an ordered list of card `id`s (the shuffled practice order),
- the index of the current card,
- the current reveal stage (how many faces of the current card are shown).

The session never writes back to the stored deck.

### Stage definition
Let `L = deck.revealOrder.length` (faces per card) and `N` = number of cards in the session. A card's stage `s` runs `0 .. L-1`, and stage `s` means faces `revealOrder[0..s]` are shown (i.e. `s + 1` faces). So stage 0 shows only the first face; stage `L-1` shows the fully revealed card.

### Controls
- **Reveal next / advance** — mouse click, spacebar, or right arrow (→).
- **Go back** — left arrow (←). Exact inverse of advance.
- After the final face of the final card, the session shows a **"Done"** state.

### Forward behavior
At (card `i`, stage `s`):
- if `s < L - 1` → advance to `(i, s+1)` — reveal one more face.
- else if `i < N - 1` → advance to `(i+1, 0)` — next card, first face only.
- else → session complete ("Done").

### Back behavior
"Back" is the exact inverse of forward.
- if `s > 0` → `(i, s-1)` — hide the most recently revealed face.
- else if `i > 0` → `(i-1, L-1)` — previous card, **fully revealed**.
- else → no-op (already at the very start).

### Shuffle
Produce the session's card order with a Fisher–Yates shuffle over the card `id`s. Shuffle the session order only — never the stored deck.

## UI / screens (two-button home flow)

- **Auth (entry screen, planned — not yet built)** — shown on load unless an auth session already exists. Three options: **Log in**, **Sign up**, **Continue as guest**. If an auth session already exists, this screen is skipped entirely and the app opens straight to Home. See Backend for the auth flow.
- **Home** — two buttons: **Start** and **Edit Decks**.
- **Deck list** — a single screen parameterized by a **mode**: `practice` or `edit`. It lists all of the user's decks. This is the *same component* for both flows; only the mode and header differ.
  - **Start** opens the deck list in **practice** mode → tapping a deck begins a practice session. Header e.g. "Choose a deck to practice."
  - **Edit Decks** opens the deck list in **edit** mode → shows add-deck and delete-deck controls; tapping a deck opens the deck editor. Header e.g. "Edit decks."
- **Deck editor** — for one deck: list its cards; add a card; edit a card (its structured fields); delete a card; rename or delete the deck.
- **Practice session** — the multi-stage reveal screen described above; ends on "Done."

The mode must be visually unambiguous (distinct header text) so practice-select and edit-select never feel like the same action.

## Storage

- **Guests:** browser-local IndexedDB (unchanged from v1) — see `localStore` in Backend.
- **Accounts:** hosted Postgres via Supabase — see `remoteStore` in Backend.
- Stable client-generated ids and a clean, consistent `Deck`/`Card` shape mean the same types work unmodified across both, and the data can move between them (see First-sign-up migration below).

## Backend (accounts + sync)

**Status: designed, not yet implemented.** See `CLAUDE.md` → Status for the current build state before assuming any of this exists in code.

### Goal
Let a signed-up user's decks persist and stay in sync across devices/browsers. Guests can use the full app with zero setup, but per Foundational rule 4, their data is not guaranteed to survive.

### Storage interface
`db.ts` keeps its existing exported shape — `getAllDecks`, `saveDeck`, `deleteDeck` — but becomes an interface with two implementations, selected by `App.tsx` based on auth state:
- **`localStore`** — today's IndexedDB implementation, unchanged. Used for guests.
- **`remoteStore`** — Supabase-backed implementation. Used once a user is signed in, and becomes the *sole* source of truth for that account (no offline cache, no dual-write, no merge/conflict logic to build or reason about).

No component ever calls IndexedDB or Supabase directly — only through these two exported functions. Every existing call site (`App.tsx`, `DeckEditor.tsx`, `PracticeSession.tsx`, etc.) is unaffected by which implementation is active.

### Auth & guest flow
- Auth provider: Supabase Auth, email/password only for v1 of the backend. OAuth providers (e.g. Google) can be added later without a schema change — see Reserved for later.
- On load, check for an existing Supabase auth session; if present, skip the Auth screen and go straight to Home.
- Guest mode requires no auth session at all — it's simply the absence of one, using `localStore`.

### First-sign-up migration
A guest may already have decks sitting in local IndexedDB before ever creating an account. On first successful **sign-up** (not on ordinary login), if `localStore` has decks, prompt: "Import your local decks into your account?" Accepting pushes each local deck through `remoteStore.saveDeck` — the same write path an ordinary save uses, not a special-cased import path. This is one-time, triggered only immediately after sign-up.

### Schema (Postgres via Supabase)
```sql
decks (
  id             text primary key,        -- client-generated, e.g. generateId('deck')
  user_id        uuid not null references auth.users,
  name           text not null,
  reveal_order   text[] not null,
  created_at     timestamptz not null,
  last_practiced timestamptz
)

cards (
  id            text primary key,         -- client-generated, e.g. generateId('card')
  deck_id       text not null references decks(id) on delete cascade,
  english       text not null,
  pinyin        text not null,
  chinese       text not null,
  notes         text not null default '',
  created_at    timestamptz not null,
  last_reviewed timestamptz,
  srs           jsonb not null            -- { nextDue, interval, ease } — same shape as Card.srs, still unused
)
```
- Ids stay client-generated text, matching `generateId()` — no id-remapping layer between local and remote.
- `cards` is a real table with a `deck_id` foreign key rather than a nested array. This happens to be the same normalization that Cross-deck cards (see Reserved for later) would eventually need — not built now (`deck_id` stays single-valued, not many-to-many), but the shape doesn't fight it.
- **Row-level security:** every policy on both tables scopes to `auth.uid() = user_id` (for `cards`, via a join through `deck_id`), so an account can only ever see or modify its own rows.

### Writes are atomic via a single RPC
Every existing call site saves a *whole* deck object, including its full `cards` array, even for a one-field change (e.g. editing a note in `PracticeSession.tsx`). Against two normalized tables, "save this deck" means: upsert the deck row, then upsert changed/new cards and delete removed ones — three operations that must succeed or fail together. `remoteStore.saveDeck` calls a single Postgres function, `save_deck(deck jsonb)`, that performs this diff-and-upsert server-side inside one transaction. The client still makes one round trip, and the existing "save the whole deck" calling convention used throughout the app doesn't change.

## Reserved for later (do not build in v1; keep data compatible)

- **Spaced repetition (SRS).** Schedule reviews with a proven algorithm (SM-2 or FSRS) using the reserved per-card `srs` metadata (`nextDue`, `interval`, `ease`) plus `lastReviewed`. This is the natural direction of the "track the last time a card/deck was seen" goal.
- **Graded review.** After revealing a card, let the learner mark "knew it / didn't know"; this feeds the SRS scheduler. (v1 is pure review, so this adds a step to the practice UI when introduced.)
- **Additional faces.** Extra reveal stages such as an example sentence or audio, added by appending to `revealOrder`.
- **OAuth sign-in.** Google (or other) sign-in alongside email/password — schema-compatible with the Backend design above, no migration needed.
- **Native/mobile app.** Can now be built directly on the Backend schema and auth above rather than needing its own backend design — shares the same `Deck`/`Card` types and the same Supabase project.
- **Cross-deck cards.** If a card ever needs to belong to multiple decks, move from a single `deck_id` per card to a join table (`card_id`, `deck_id`) instead. Not needed for v1.
