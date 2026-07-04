# Flashcard App — Project Specification

## Purpose of this document
Reference spec for a multi-stage-reveal flashcard app, written to give an LLM full context on the intended design. Treat everything under **v1 scope** as what to build now, and **Reserved for later** as future direction the data model must stay compatible with but that should *not* be implemented yet.

## The core idea
A flashcard web app whose defining feature is **multi-stage reveal**: each card reveals its content in ordered stages rather than a single front/back flip. The default sequence is English → pinyin → Chinese character, so a learner sees the meaning, then the pronunciation, then the written character. The app targets Chinese vocabulary, but the reveal mechanism is general and not tied to those three fields. Web first; a mobile app may follow and should share the same data model.

## Terminology
- **Card** — one flashcard. Holds structured fields (see schema).
- **Deck** — a named collection of cards; the unit a user practices at a time. (Earlier drafts called this a "lesson"; the app uses "deck" everywhere.)
- **Face / stage** — one reveal step of a card. A card is revealed one face at a time in a defined order.
- **Session** — one practice run over a single deck.

## Data model

### Foundational rules
1. **Cards are structured objects, never delimited strings.** Each field is stored on its own. Do not encode multiple fields into one string and parse them apart — fields may contain spaces or arbitrary text.
2. **Every card and every deck has a stable, unique `id`.** Identify cards and decks by `id`, never by array position. Order changes (shuffle, edits, deletes), so an index is not a reliable handle.
3. **Stored decks are the source of truth and are immutable during practice.** Practice happens on a *session* built on top of a deck; it never mutates the stored deck (no in-place shuffling of stored data).

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
"Back" is the exact inverse of forward. (This corrects a bug in the prototype where stepping back to a previous card left it at its first face instead of fully revealed.)
- if `s > 0` → `(i, s-1)` — hide the most recently revealed face.
- else if `i > 0` → `(i-1, L-1)` — previous card, **fully revealed**.
- else → no-op (already at the very start).

### Shuffle
Produce the session's card order with a Fisher–Yates shuffle over the card `id`s. Shuffle the session order only — never the stored deck. Use a plain temp-variable swap (the prototype's `splice`-based swap is unnecessarily slow and opaque).

### Progress display
Show progress during a session (e.g. current position and how many cards remain), based on the session's card list, not on mutating the deck.

## UI / screens (two-button home flow)

- **Home** — two buttons: **Start** and **Edit Decks**.
- **Deck list** — a single screen parameterized by a **mode**: `practice` or `edit`. It lists all of the user's decks. This is the *same component* for both flows; only the mode and header differ.
  - **Start** opens the deck list in **practice** mode → tapping a deck begins a practice session. Header e.g. "Choose a deck to practice."
  - **Edit Decks** opens the deck list in **edit** mode → shows add-deck and delete-deck controls; tapping a deck opens the deck editor. Header e.g. "Edit decks."
- **Deck editor** — for one deck: list its cards; add a card; edit a card (its structured fields); delete a card; rename or delete the deck.
- **Practice session** — the multi-stage reveal screen described above; ends on "Done."

The mode must be visually unambiguous (distinct header text) so practice-select and edit-select never feel like the same action.

## Storage

- **v1:** store everything in the browser — **IndexedDB** preferred (structured data, room to grow), or localStorage if the dataset stays small. No backend required.
- **Design for migration now:** stable ids, timestamps, and the clean schema above should be in place from the start so the data can lift into a hosted backend later without a rewrite.

## Framework / implementation notes

- Build as a standard **DOM web app (likely React)** — buttons, deck lists, and card-editing forms belong in HTML/CSS/JS, not on a drawing canvas.
- A ProcessingJS / Khan-Academy canvas prototype exists; **carry over only the interaction model** (click/space/→ to advance, ← to go back, multi-stage reveal). Do *not* carry over canvas drawing, string-parsing of cards, or in-place shuffling of stored data.
- The reveal card in the DOM is just showing/hiding elements per stage.

## Reserved for later (do not build in v1; keep data compatible)

- **Spaced repetition (SRS).** Schedule reviews with a proven algorithm (SM-2 or FSRS) using the reserved per-card `srs` metadata (`nextDue`, `interval`, `ease`) plus `lastReviewed`. This is the natural direction of the "track the last time a card/deck was seen" goal.
- **Graded review.** After revealing a card, let the learner mark "knew it / didn't know"; this feeds the SRS scheduler. (v1 is pure review, so this adds a step to the practice UI when introduced.)
- **Additional faces.** Extra reveal stages such as an example sentence or audio, added by appending to `revealOrder`.
- **Accounts + sync + mobile app.** Hosted backend (e.g. Firebase/Firestore or Supabase) for auth, multi-device sync, and a native/mobile client sharing the same data model.
- **Cross-deck cards.** If a card ever needs to belong to multiple decks, switch from nested cards to a shared card pool where each card references its deck(s) by id. Not needed for v1.
