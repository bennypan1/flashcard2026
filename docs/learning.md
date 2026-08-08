# Learning plan

This branch (`learn`) exists so Benny can learn to write this code, not just own it.
It is a **scratch branch** — breaking the app here is expected and encouraged. `main`
always holds the working version.

## The rule that makes this work

**Benny writes all the code. Claude explains, hints, and reviews — but does not implement.**

The full rule is in `CLAUDE.md` → Learning mode. If Claude starts writing features again,
say "learning mode" and it should stop.

Why: reading code you didn't write produces the *feeling* of understanding and almost no
retention. Learning happens when you produce something and get corrected.

## The escape hatch (read this before you start)

Stuck for more than **~20 minutes** on one thing? Open the original file, read *only* the
piece you're stuck on, close it, and keep going. Then ask Claude why it works that way.

You never lose an evening to being blocked. This is not an exam.

## How to ask for help

Good asks:
- "Why does X work this way?"
- "I think the problem is Y — am I close?"
- "Give me a hint, not the answer."
- "Here's what I wrote — review it."

Avoid: "write this component for me." That's the thing that got us here.

---

## Phase A — map the territory (one evening, 2–3 hrs)

Read every file once. **Not** to master it — just to learn what lives where and what calls
what. Ask about anything confusing. Then stop reading and start writing.

Suggested order (dependencies first):

- [ ] `src/types.ts` (25 lines) — the data model everything else assumes
- [ ] `src/utils.ts` (15) — `generateId`, Fisher-Yates `shuffle`
- [ ] `src/main.tsx` (10) — how the app boots
- [ ] `src/App.tsx` (111) — screen state, deck state, all DB mutations
- [ ] `src/db.ts` (112) — the storage seam
- [ ] `src/components/*.tsx` — smallest to largest
- [ ] `docs/spec.md` — the *why* behind all of it

## Phase B — break things on purpose (~20 min)

Working code hides its own reasons: most lines exist to prevent a problem you've never
seen. Reading tells you what a line *does*; removing it tells you what it *prevents*.
This is also the only phase that trains debugging — reading symptoms backwards to a
cause — in a rigged setting where the answer is one line away.

**The prediction is the exercise.** Write down what you think will break *before* you run
it. Being wrong in writing is what makes it stick. If you skip that step and just
delete → shrug → revert, this phase is a waste of time — skip it and go to Phase C.

Three exercises, each a mistake you would otherwise make for the first time in real code:

- [ ] **Listener cleanup.** Delete the `return () => window.removeEventListener(...)` in
      `PracticeSession.tsx:82`. Enter practice, exit, enter, exit, enter — then press `→`
      *once*. How many stages did it advance, and why that number?
- [ ] **Remount on key change.** Remove `key={screen.deckId}` from `<DeckEditor>` in
      `App.tsx:90`. Edit one deck, go back, open a *different* deck. What's stale, and
      what does that tell you about when React reuses a component vs. rebuilds it?
- [ ] **Stale closure.** In `advance()`, change `setSession((prev) => ...)` to read
      `session` directly instead. Press `→` a few times. Why does it stop working, and
      what does `[L, N]` in the `useCallback` deps have to do with it?

`git checkout .` undoes all of it.

Cut as low-value: the lazy-initializer and force-`remoteStore` variants — the first has no
visible symptom, the second just prints an error. Ask about those two instead of doing them.

## Phase C — rebuild, one file at a time (the main event, ~15 hrs)

For each file: `rm` it, write it from scratch with the original **closed**, then
`git diff` against the original and have Claude explain every difference.

Everything else in the app stays intact the whole time — you always have a working
reference one `git checkout` away, and an instant test: does the app run again?

| # | File | Lines | Est. | What it teaches | Done |
|---|------|-------|------|-----------------|------|
| 1 | `components/Home.tsx` | 21 | 30–60m | props, JSX, callbacks | [ ] |
| 2 | `components/ConfirmDialog.tsx` | 20 | 30m | reusable components, conditional render | [ ] |
| 3 | `components/DeckList.tsx` | 117 | ~2h | lists, `key`, rendering by `mode` | [ ] |
| 4 | `components/CardEditor.tsx` | 116 | ~2h | controlled form inputs | [ ] |
| 5 | `db.ts` | 112 | ~3h | Promises, `async`/`await`, the interface seam | [ ] |
| 6 | `components/DeckEditor.tsx` | 225 | ~3h | CRUD, lifting state, immutable updates | [ ] |
| 7 | `components/PracticeSession.tsx` | 246 | 4–6h | state machine, `useEffect` cleanup, `useCallback` | [ ] |

Rebuild #7 last. It's the hardest file in the project and it's where the app's actual
ideas live.

## Phase D — build something solo

Only after Phase C. Two options, in increasing difficulty:

1. **A small feature in this app** — reveal-order editing, a card search box, a "shuffle
   off" toggle. Small, self-contained, real.
2. **The backend** — `supabase/migrations/` and `docs/spec.md` → Backend already describe
   it; `remoteStore` in `db.ts` is a stub waiting to be filled in. This teaches auth,
   HTTP, and databases — genuinely different skills from the frontend. Claude reviews only.

Then: a new project from an empty folder. That's the graduation exam, not the class —
it's much easier once you have a codebase you actually understand to steal patterns from.

---

## Self-test

You know this project when you can answer these **without looking**:

1. Why does `goBack` use `setSession((prev) => ...)` instead of reading `session` directly?
2. What breaks if `useState(() => makeSession(deck))` loses its arrow function?
3. Why does the `useEffect` in `PracticeSession` return a function?
4. Why is `key={screen.deckId}` on `<DeckEditor>`, and what bug appears without it?
5. Why is `Screen` a union of object types instead of just `screen: string`?
6. Why do components call `db.ts`'s exported functions instead of `localStore` directly?
7. Why does practice shuffle `deck.cards.map(c => c.id)` instead of shuffling `deck.cards`?

## Concepts to shore up as you go

Not a general JS course — just what's actually opaque in *this* code:

- **Promises / `async`-`await`** — `db.ts` hand-wraps IndexedDB's callback API into
  Promises. It's the least readable file you own, and the one that most rewards
  understanding.
- **React's model** — UI as a function of state; why you never mutate state; when a
  component re-renders.
- **Immutable array updates** — the spread-and-replace in `App.tsx:41-47`, `.map` in the
  note handler, `.filter` in delete.
- **TypeScript discriminated unions** — `Screen` in `App.tsx:16-20` is a textbook case.

## Log

Keep notes here as you go — what clicked, what didn't, questions to come back to.

- **2026-08-08** — branch created, plan written. Starting Phase A.
