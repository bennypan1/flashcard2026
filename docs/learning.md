# Learning plan

This branch (`learn`) exists so Benny can learn to write this code, not just own it.
It is a **scratch branch** — breaking the app here is expected and encouraged. `main`
always holds the working version.

## The one rule

**Benny writes all the code. Claude explains, hints, and reviews — but does not implement.**

The full rule is in `CLAUDE.md` → Learning mode. If Claude starts writing features again,
say "learning mode" and it should stop.

Why: reading code you didn't write produces the *feeling* of understanding and almost no
retention. Learning happens when you produce something and get corrected.

---

## How this curriculum works

This is a course, not a reading list. It has eight units. Each one gives you **one new
idea**, uses the real codebase as its example, and ends with something you have to
*produce* — an explanation, a drawing, a prediction, a file.

Five rules govern how it's taught. They exist because earlier versions of this document
broke all five.

**1. Top-down, always.** Every unit goes **shape → flow → line**. What is this thing and
what is it for → what happens in what order → what does this specific line do. Never the
reverse. A line of code is meaningless until you know what job the file has, and a file is
meaningless until you know what job the app has.

**2. "What" before "why".** "Why is `key={screen.deckId}` there?" is unanswerable until you
know what `key` is, what `DeckEditor` is, and what happens without it. Design questions
come *last* in a unit, never first.

**3. No unexplained vocabulary.** Every unit lists the terms it introduces and defines them
in plain English *before* using them. Most of the time a question is unanswerable, the
problem is one unfamiliar word, not the concept.

**4. "I don't understand the question" is the correct answer sometimes** — and it is a
finding, not a failure. It means a rung is missing below the one being asked about. The
response is to go find that rung, never to rephrase the same question louder. Say it
freely; it is the fastest signal in this entire process.

**5. Nothing is asked that a unit hasn't taught.** If a question depends on knowing
something we haven't covered, it's a broken question. Call it out and it gets fixed.

### The escape hatch

Stuck for more than **~20 minutes** on one thing? Open the file, read *only* the piece
you're stuck on, close it, and keep going. Then ask why it works that way.

You never lose an evening to being blocked. This is not an exam.

### How to ask for help

- "I don't understand the question."
- "What does the word ___ mean here?"
- "I think it works like ___ — am I close?"
- "Give me a hint, not the answer."
- "Here's what I wrote — review it."
- "Show me where that happens" (pointing at a file is fine; writing it for you is not).

Avoid: "write this component for me." That's the thing that got us here.

---

## The map

| Unit | Question it answers | Files | Time |
|---|---|---|---|
| **0** | What does this app *do*? | none — you use the app | 30m |
| **1** | What does it store? | `types.ts` | 45m |
| **2** | What screens exist, and what decides which one you see? | `App.tsx` (top half) | 1h |
| **3** | What happens when I click a button? | `Home.tsx`, `App.tsx` | 1.5h |
| **4** | Where does the data live — and what survives a refresh? | `App.tsx`, `db.ts` (as a black box) | 1.5h |
| **5** | How does an edit get saved? | `DeckEditor.tsx`, `CardEditor.tsx` | 2h |
| **6** | How does practice actually work? | `PracticeSession.tsx` | 3h |
| **7** | How does saving *really* work, underneath? | `db.ts` (opened up) | 2h |
| **R** | Can I write it myself? | all of them, from scratch | ~15h |
| **S** | Can I build something new? | your choice | open |

Units 0–7 are roughly 12 hours and are about **understanding**. Phase R is where
understanding becomes ability, and it's the bigger half. Don't skip it — but don't start
it either, until 0–7 are done.

Order matters. Each unit assumes the one before it. `db.ts` is deliberately dead last of
the reading units even though other files import it, because it's the hardest file in the
project and you can use it as a black box for a long time before you need to open it.

---

## Unit 0 — What does this app do?

Before any code. You cannot understand a codebase you can't describe the behavior of.

**You'll be able to:** describe the whole app to someone in 60 seconds.

**Do this:**

1. `npm run dev`, open `localhost:5173`.
2. Use it like a user. Make a deck. Add three cards. Practice it. Edit a card mid-practice.
   Delete a deck. Try to break it.
3. Refresh the page mid-way through practice. Note what survived and what didn't. Note it
   *before* you have any theory about why.
4. Write down, in plain English, no code words:
   - What is this app for?
   - What can a user do in it? (list every action you found)
   - What screens are there, and which ones can you get to from which?
5. Draw the screens as boxes with arrows between them. Paper is fine. Photo it into the
   chat, or just describe it.

**You've got it when:** you can name every screen and every action without opening the app,
and your arrow diagram matches what the app actually does.

**Placement check** — answer these honestly; "no" is expected and costs nothing:

- Can you describe what the app does? → if no, redo step 2.
- Do you know which screen leads to which? → if no, redo step 5.
- Have you ever read a file in `src/` and understood roughly what it was for? → if no, that
  is the normal starting point and Unit 1 is built for it.
- Do you already know what `useState` does? → if yes, we'll move faster from Unit 3 on. If
  no, that's fine; Unit 3 introduces it properly.

---

## Unit 1 — What does it store?

Every app is, underneath, a pile of data plus rules about how that data changes. Learn the
data first. It's the smallest file in the project and the one everything else assumes.

**You'll be able to:** say exactly what a deck and a card *are*, and what the app knows
about each.

**Vocabulary:**
- **type** — a description of the *shape* of a piece of data: which fields it has and what
  kind of value each holds. It is a rule the computer checks, not data itself.
- **interface** (TypeScript) — the keyword for writing one of those descriptions down.
- **field / property** — one named slot inside that shape (`name`, `id`, `cards`).
- **`string`, `number`** — text, and a numeric value.
- **`number | null`** — "either a number, or nothing." The `|` means "or."
- **`Card[]`** — "a list of Cards." The `[]` means "many of these."

**Do this:**

1. Open `src/types.ts` (25 lines). Read it once, top to bottom.
2. Take the deck you made in Unit 0 and write it out by hand as data — every field in
   `Deck`, filled in with your actual deck's values, including all its cards. Guess at
   anything you can't tell from the UI, and mark the guesses.
3. Answer, in English:
   - Which fields did you see in the app's interface, and which are invisible to the user?
   - `lastReviewed` is `number | null`. What does the `null` case represent, in user terms?
   - A `Deck` contains `cards: Card[]`. What does that tell you about whether a card can
     be in two decks?
4. `revealOrder` is the one field that isn't obvious. Look at what practice does in the app
   again, then say what you think it holds. (This one is a known trap — being wrong here is
   normal and useful.)

**You've got it when:** you can recite the fields of `Card` and `Deck` from memory and say
what each is *for* — not just its type.

**Ask about afterward:** why `srs` is a nested object rather than three fields on `Card`;
why `id` exists at all when decks already have names.

---

## Unit 2 — What screens exist, and what decides which one you see?

Now the control flow. One file, one job: `App.tsx` decides what you're looking at.

**You'll be able to:** point at the exact lines that decide which screen is on the display.

**Vocabulary:**
- **component** — a function that returns a description of some UI. `App` is one. `Home` is
  one. That's the whole concept.
- **render** — the act of calling that function to produce the description; React then
  makes the real page match it.
- **JSX** — the HTML-looking syntax inside the code (`<Home ... />`). It is a function call
  wearing a costume; `<Home />` means "run the `Home` component here."
- **state** — data the app holds in memory that can change while it's running, and which
  the display depends on.

**Do this:**

1. Open `src/App.tsx`. **Do not read it top to bottom.** Read it in this order:
   - Lines 16–20: the `Screen` type. Compare it to the box-and-arrow drawing you made in
     Unit 0. Does the list of screens match?
   - Lines 58–110: the `switch`. For each `case`, note which component it shows.
2. Match every branch of that switch to a screen in your drawing. Anything in one but not
   the other means one of them is wrong — find out which.
3. Note that `{ type: 'deck-editor'; deckId: string }` carries an extra piece of data, but
   `{ type: 'home' }` doesn't. Why does that one need a `deckId` and home doesn't?
4. Look at line 23: `useState<Screen>({ type: 'home' })`. Don't worry about how `useState`
   works yet — just answer: what does this line say the app shows first?

**You've got it when:** you can say, without the file open, "the current screen is one
value, it's one of four shapes, and a `switch` on it picks the component."

**Ask about afterward:** why `Screen` is a set of shapes instead of just `screen: string`.
That's a design question, and it belongs *after* this unit, not during it.

---

## Unit 3 — What happens when I click a button?

The single most useful skill in reading an unfamiliar codebase: pick one user action and
trace it all the way through. Everything else is a variation on it.

**You'll be able to:** follow any click in this app from the pixel to the code that reacts.

**Vocabulary:**
- **props** — the inputs to a component. Written like HTML attributes:
  `<Home onStart={...} />` passes a prop named `onStart`.
- **callback** — a prop whose value is a *function*, handed down so the child can call it
  when something happens. The child doesn't know what it does; the parent decides.
- **`() => { ... }`** — an arrow function: a function written inline as a value. `() =>` is
  just the way you spell "a function taking no arguments" here.
- **event handler** — a function that runs in response to something the user did
  (`onClick`).

**Do this:**

1. Open `src/components/Home.tsx` (21 lines — the smallest component in the project). Read
   the whole thing. Note it does nothing but show two buttons.
2. Find the two things it receives from outside (lines 1–4) and the two places it uses them
   (lines 12, 15).
3. Now trace one click end to end. Click "Start" in the running app, then follow it:
   - `Home.tsx:12` — the button's `onClick` is `onStart`. Where did `onStart` come from?
   - `App.tsx:62` — there it is, being passed in. What does it do when called?
   - What changes as a result? Which line then decides what's on screen instead?
4. Write the trace out as numbered steps, in English. Aim for 4–6 steps, ending in "the
   deck list appears."
5. Do it again *without help* for the "Edit Decks" button. Then again for the back button
   in `DeckList`.

**Notice the shape:** `Home` doesn't know what "start" means. It knows only that someone
gave it a function to call. That is the single most reused idea in this codebase — the same
pattern appears in every component here.

**You've got it when:** you can trace a click you've never looked at before, alone, in
under two minutes.

**Ask about afterward:** why `Home` is given a function instead of just deciding for itself
what screen comes next; what would go wrong if every component set the screen directly.

---

## Unit 4 — Where does the data live?

Unit 0 asked you to refresh the page and notice what survived. Now find out why.

**You'll be able to:** say, for any piece of data in this app, whether it lives in memory or
on disk, and what that means when you close the tab.

**Vocabulary:**
- **in memory** — exists only while the page is open. Refresh, and it's gone.
- **persisted / on disk** — written somewhere durable. Survives refresh and reboot.
- **IndexedDB** — a database built into the browser. The disk in question. It belongs to
  the *browser*, not to a server — another machine won't have your decks.
- **`useState`** — how a component holds a value in memory that can change, and tells React
  to re-render when it does. Two parts: the current value, and a function to set a new one.
- **`useEffect`** — a way to say "run this code at a particular moment in the component's
  life," typically to talk to the outside world. Here: "when the app first starts, load the
  decks."
- **async / `await` / promise** — an operation that finishes *later* rather than
  immediately, and the syntax for waiting on it. Reading a database takes time; the program
  doesn't freeze while it waits. Unit 7 opens this up properly — for now, `await x()` just
  means "do x, wait for it to finish, then continue."

**Do this:**

1. In `App.tsx`, find the three pieces of state (lines 23–25). For each: what does it hold,
   and what breaks if it were wrong?
2. Read lines 27–37 — the startup effect. Ignore *how* it works; answer *what* it does and
   *when* it runs. Why does the app need a `loading` state at all (line 56)?
3. Open `src/db.ts` but **only read lines 1–12** — the `StorageBackend` interface. Those
   three function names are the entire storage vocabulary of this app. Close the file.
4. Now, using only those three names, answer: how does the app get decks at startup? How
   would it save one? Where does deleting happen?
5. Prove the memory/disk split. In the running app, make a deck. Refresh — it's there.
   Now go into practice, advance three cards, refresh. Where did you land, and why is that
   different?

**You've got it when:** you can answer "what happens to X on refresh?" for decks, cards, the
current screen, and practice position — and explain the pattern behind the answers.

**Ask about afterward:** why components are forbidden from touching IndexedDB directly
(`CLAUDE.md` invariant #7); why `db.ts` exports plain functions *and* a `localStore` object
that has the same three functions.

---

## Unit 5 — How does an edit get saved?

Unit 3 traced a click that changed a screen. Now trace one that changes *data* — a longer
path, and the first one that touches storage.

**You'll be able to:** follow a piece of user input from a keystroke into the database.

**Vocabulary:**
- **controlled input** — a text box whose displayed value comes *from* state, and whose
  keystrokes go *to* state. The data is the source of truth; the box is just a view of it.
- **mutate vs. replace** — changing an object in place, versus building a new one and
  swapping it in. This codebase always does the second. Unit 5 is where you find out it
  matters; Phase R is where it starts to feel natural.
- **`.map` / `.filter`** — build a new list by transforming every item / by keeping some
  items. Neither changes the original list.
- **spread (`...`)** — "copy everything from this, then override these bits."
  `{ ...deck, name: 'New' }` = a new deck identical to `deck` but renamed.
- **lifting state** — when two components need the same data, it lives in their shared
  parent instead of in either of them. Here, decks live in `App.tsx` for this reason.

**Do this:**

1. Trace the save. In the app, edit a card's English text and hit save. Then follow it:
   `CardEditor.tsx` → `DeckEditor.tsx` → `App.tsx:39` (`handleSaveDeck`) → `db.ts`. Write
   the steps out.
2. At each hop, answer one question: **what shape is the thing being passed?** A string? A
   card? A whole deck? (The answer surprises most people — notice what `handleSaveDeck`
   actually receives.)
3. Read `App.tsx:39-48` closely — now you're at line level, and you've earned it. It does
   two things in order. What are they, and what would break if you did only one?
4. Lines 44–45 copy the array before changing it, instead of just assigning into the
   existing one. Try changing it to mutate directly (`prev[idx] = deck`), and see what
   happens in the app. Predict first, in writing.
5. **Break something on purpose.** Delete `key={screen.deckId}` from `App.tsx:90`. Edit one
   deck, go back, open a *different* deck. Predict the symptom before you run it. Then
   `git checkout .`.

**You've got it when:** you can explain why saving one card sends the *whole deck* to the
database, and say whether you think that's a good design (either answer is defensible —
have a reason).

---

## Unit 6 — How does practice actually work?

The hardest file, and the one where the app's real ideas live. It's 246 lines, so approach
it by *behavior* first, never by reading top to bottom.

**You'll be able to:** describe practice as a set of states and the moves between them.

**Vocabulary:**
- **state machine** — a system that is always in exactly one of a known set of states, and
  changes between them only via defined moves. Most interactive features are one, whether
  or not anyone says so out loud.
- **derived state** — a value computed from other values rather than stored (`revealedFaces`
  is derived; `currentStage` is stored). Storing what you could derive is how two sources of
  truth start disagreeing.
- **session** — here, the temporary object representing *this run* of practice. The stored
  deck is never touched (`CLAUDE.md` invariant #3).
- **cleanup** — undoing a setup step when a component goes away: removing a listener you
  added, closing what you opened.

**Do this:**

1. **Behavior first, no code.** In the app, practice a 3-card deck and map it: what are all
   the distinct things you can see, and what moves you between them? Include the end screen
   and the empty-deck case. Draw it.
2. Now open `PracticeSession.tsx` and find `SessionState` (lines 11–16). Compare its four
   fields to your drawing. Your drawing is probably right and less precise — where?
3. Read `makeSession` (30–37). Notice it shuffles `deck.cards.map(c => c.id)` — a list of
   ids, not the cards. Why ids and not the cards themselves?
4. Read `advance` (47–55). It has three branches. Match each to a move in your drawing.
   Then read `goBack` (57–68) and check: is it the exact reverse? Find the case that needed
   special handling and explain why.
5. **Break something on purpose.** Delete the `return () => window.removeEventListener(...)`
   on line 82. Enter practice, exit, enter, exit, enter — then press `→` **once**. Predict
   the number of stages it advances *before* running. Then `git checkout .`.
6. Only now, the design questions: why does `advance` use `setSession((prev) => ...)`
   instead of reading `session` directly? Why does the `useEffect` return a function at all?

**You've got it when:** you can draw the state machine from memory and explain what
`currentIndex` and `currentStage` mean without looking.

---

## Unit 7 — How does saving really work, underneath?

Last, because it's the hardest and because you've been using it as a black box for three
units without needing to know.

**You'll be able to:** read asynchronous code without flinching.

**Vocabulary:**
- **callback-style API** — an older way of handling "finishes later": you hand the operation
  a function to call when it's done (`req.onsuccess = ...`).
- **promise** — an object representing a result that will exist later. Strictly better than
  callbacks because it can be passed around, returned, and chained.
- **`new Promise((resolve, reject) => ...)`** — the adapter that turns the first thing into
  the second. `resolve` = "it worked, here's the value"; `reject` = "it failed."
- **interface as a seam** — a fixed set of function names that callers use, with a swappable
  implementation behind it. `StorageBackend` is one.

**Do this:**

1. Re-read `db.ts:1-12` (you saw it in Unit 4) and `db.ts:96-112` (the delegation). Between
   them, that's the whole *public* story: three names, one swappable implementation.
2. Read `openDB` (22–34). It is the pattern the whole file repeats. Answer: what are
   `resolve` and `reject`? Who calls them, and when?
3. Read `localStore.getAllDecks` (37–44). Find the same pattern. Now you've read the file —
   the other two methods are the same shape.
4. Read `remoteStore` (76–86) and `setActiveStore` (98–100). What does it mean that
   `App.tsx` can swap the whole storage layer with one line (`App.tsx:32`)?
5. Predict: what happens today if you change `const signedIn = false` to `true` in
   `App.tsx:31`? Then try it, then change it back.

**You've got it when:** you can explain to someone what a promise is without using the word
"promise," and say why `db.ts` exists as a layer instead of components calling IndexedDB.

---

## Phase R — rebuild, one file at a time (the main event, ~15 hrs)

Understanding is not ability. This is where that gap closes, and it's the biggest part of
the plan.

For each file: `rm` it, write it from scratch with the original **closed**, then `git diff`
against the original and have Claude explain every difference.

Everything else stays intact the whole time — you always have a working reference one
`git checkout` away, and an instant test: does the app run again?

| # | File | Lines | Est. | Unit it draws on | Done |
|---|------|-------|------|-----------------|------|
| 1 | `components/Home.tsx` | 21 | 30–60m | 3 | [ ] |
| 2 | `components/ConfirmDialog.tsx` | 20 | 30m | 3 | [ ] |
| 3 | `components/DeckList.tsx` | 117 | ~2h | 2, 3 | [ ] |
| 4 | `components/CardEditor.tsx` | 116 | ~2h | 5 | [ ] |
| 5 | `db.ts` | 112 | ~3h | 4, 7 | [ ] |
| 6 | `components/DeckEditor.tsx` | 225 | ~3h | 5 | [ ] |
| 7 | `components/PracticeSession.tsx` | 246 | 4–6h | 6 | [ ] |

Rebuild #7 last. If a file fights you for more than 20 minutes, the escape hatch applies —
open the original, read only the stuck part, close it, continue.

## Phase S — build something solo

Only after Phase R. In increasing difficulty:

1. **A small feature in this app** — reveal-order editing, a card search box, a "shuffle
   off" toggle. Small, self-contained, real.
2. **The backend** — `supabase/migrations/` and `docs/spec.md` → Backend already describe
   it; `remoteStore` in `db.ts` is a stub waiting to be filled in. Claude reviews only.
   Deliberately chosen because it's the *least* React-shaped work available: SQL and the
   relational model, HTTP, authentication, and client/server trust boundaries.
3. **A new project from an empty folder.** The graduation exam, not the class.

---

## Graduation self-test

Attempt this only after Unit 7. Each question names the unit that answers it — if one is
unanswerable, that unit is the one to revisit, and that's the whole purpose of the list.

1. Why is `Screen` a set of object shapes instead of just `screen: string`? *(Unit 2)*
2. Why do components receive callbacks instead of setting the screen themselves? *(Unit 3)*
3. Why do components call `db.ts`'s functions instead of `localStore` directly? *(Units 4, 7)*
4. Why does saving one card send the whole deck to storage? *(Unit 5)*
5. Why is `key={screen.deckId}` on `<DeckEditor>`, and what bug appears without it? *(Unit 5)*
6. Why does practice shuffle `deck.cards.map(c => c.id)` rather than the cards? *(Unit 6)*
7. Why does `advance` use `setSession((prev) => ...)` instead of reading `session`? *(Unit 6)*
8. Why does the `useEffect` in `PracticeSession` return a function? *(Unit 6)*

## What actually transfers

Read this section around Unit 4, not before — it needs examples you've already met.

**The subject is not React. The subject is programming; React is the vehicle.** This
project is React + TypeScript + IndexedDB because it had to be written in *something*. All
three will be replaced eventually. What must survive is the ideas underneath.

| Layer | Examples here | How long it lasts |
|---|---|---|
| **Language (JS)** | `[...arr]`, `.map`, `.filter`, closures | Permanent |
| **Platform (browser)** | `addEventListener`, IndexedDB | Predates React, will outlive it |
| **Types (TS)** | `string \| null`, unions, `keyof` | Universal to typed languages |
| **Library (React)** | `useState`, `useEffect`, JSX | The genuinely disposable layer |

Only the bottom row is React-specific, and even there most hooks are a *spelling* of a
durable idea: `useEffect` cleanup is resource lifetime management (`try/finally`, RAII,
context managers, `defer`). `useState`'s never-mutate rule is immutability. The dependency
array is cache invalidation.

The ideas worth keeping, all of which you meet in Units 1–7:

- **Value vs. reference semantics** — why `shuffle` copies with `[...arr]`. The most
  transferable idea in the codebase; the same trap exists in Python, Java, Go, C++.
- **Immutable updates** — copy-and-replace instead of mutate (Unit 5).
- **Asynchrony** — callbacks → promises → `await`, a progression nearly every modern
  language has made (Unit 7).
- **Nullability** — `number | null`, and why "absent" differs from `0` (Unit 1).
- **Making illegal states unrepresentable** — `Screen` as a union (Unit 2).
- **Stable identity** — address by id, never by position (Units 1, 6).
- **Interfaces as seams** — call the interface, not the implementation (Unit 7).
- **State machines** — legal states and legal transitions (Unit 6).

If something turns out to be pure framework trivia — the spelling of a hook, where JSX
wants a `key` — it's a lookup, not a skill, and it doesn't deserve an evening.

## Progress

- [ ] Unit 0 — what the app does
- [ ] Unit 1 — the data model
- [ ] Unit 2 — screens and navigation
- [ ] Unit 3 — tracing a click
- [ ] Unit 4 — memory vs. storage
- [ ] Unit 5 — saving an edit
- [ ] Unit 6 — the practice state machine
- [ ] Unit 7 — inside `db.ts`
- [ ] Phase R — rebuild (7 files)
- [ ] Phase S — build solo

## Log

Keep notes here as you go — what clicked, what didn't, questions to come back to.

- **2026-08-08** — branch created, plan written. Starting Phase A.
- **2026-08-08** — read `types.ts`, `utils.ts`, `main.tsx`. Clicked: nullable fields
  (`lastReviewed`) model "hasn't happened yet." Missed: thought `Deck.revealOrder` held
  card ids — it holds *card field names* (`['english','pinyin','chinese']`), so it orders
  the **faces** of each card, not the sequence of cards. The card sequence lives in the
  practice session, not the deck (invariant #3).
  Open question to return to: `revealOrder` is typed `string[]` but ought to be
  `(keyof Card)[]`; why the type is looser than the intent.
- **2026-08-15** — **rewrote this document as a curriculum.** The old version was a reading
  list plus a pile of "why does X work this way" questions, and it failed in practice:
  the questions were unanswerable without a picture of the whole app, which nothing in the
  document ever provided. A first attempt to fix it added a *lower-level* diagnostic —
  syntax questions about spread operators and closures — which was the wrong direction
  again: the gap was never syntax, it was that the codebase had no shape yet. Replaced
  everything with eight units that start at "use the app and draw the screens" and narrow
  from there, each with stated vocabulary, a concrete activity, and a produce-it check.
  Kept: the one rule, the escape hatch, the transferable-ideas framing (demoted to Unit 4+
  reading), and the rebuild phase. Next: Unit 0.
