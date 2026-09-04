import type { Card, Deck, SRS } from './types';
import { supabase } from './supabase';

// Storage interface (spec.md → Backend → Storage interface).
// getAllDecks / saveDeck / deleteDeck are the app's only storage entry points.
// They delegate to whichever StorageBackend is active — localStore for guests,
// remoteStore for signed-in accounts — so no component talks to IndexedDB or
// Supabase directly.
export interface StorageBackend {
  getAllDecks(): Promise<Deck[]>;
  saveDeck(deck: Deck): Promise<void>;
  deleteDeck(id: string): Promise<void>;
}

// ---------------------------------------------------------------------------
// localStore — browser-local IndexedDB. The guest backend.
// ---------------------------------------------------------------------------

const DB_NAME = 'flashcard2026';
const DB_VERSION = 1;
const STORE = 'decks';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: 'id' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export const localStore: StorageBackend = {
  async getAllDecks(): Promise<Deck[]> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const req = db.transaction(STORE, 'readonly').objectStore(STORE).getAll();
      req.onsuccess = () => resolve(req.result as Deck[]);
      req.onerror = () => reject(req.error);
    });
  },

  async saveDeck(deck: Deck): Promise<void> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const req = db.transaction(STORE, 'readwrite').objectStore(STORE).put(deck);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  },

  async deleteDeck(id: string): Promise<void> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const req = db.transaction(STORE, 'readwrite').objectStore(STORE).delete(id);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  },
};

// ---------------------------------------------------------------------------
// remoteStore — Supabase-backed. The signed-in backend, and the sole source of
// truth for an account: no offline cache, no dual-write, no merge logic.
// Not implemented — every method throws. See spec.md → Backend for the design.
// ---------------------------------------------------------------------------

// Row shapes as Postgres actually returns them, which differ from Card/Deck in
// two ways: snake_case keys, and timestamptz columns arriving as ISO-8601
// strings ("2026-09-04T12:00:00+00:00") rather than the epoch-millis numbers
// our types use. Both gaps are closed by the mappers below.
interface CardRow {
  id: string;
  deck_id: string;
  english: string;
  pinyin: string;
  chinese: string;
  notes: string;
  created_at: string;
  last_reviewed: string | null;
  srs: SRS;
}

interface DeckRow {
  id: string;
  user_id: string;
  name: string;
  reveal_order: string[];
  created_at: string;
  last_practiced: string | null;
  cards: CardRow[]; // populated by the embedded select in getAllDecks
}

function notImplemented(): never {
  throw new Error('remoteStore is not implemented yet — see spec.md → Backend');
}

// Row → app type. Pure functions, no I/O: given a row, produce the shape the
// rest of the app already understands.
function rowToCard(_row: CardRow): Card {
  return notImplemented();
}

function rowToDeck(_row: DeckRow): Deck {
  return notImplemented();
}

export const remoteStore: StorageBackend = {
  // One round trip, not N+1: PostgREST embeds children when you name them in
  // the select, so decks and their cards come back together as DeckRow[].
  // Cards are ordered by created_at (there is deliberately no position column);
  // ordering an embedded table needs the referencedTable option.
  async getAllDecks(): Promise<Deck[]> {
    return notImplemented();
  },

  // save_deck(jsonb) does the whole diff-and-upsert in one transaction. It
  // expects the Deck exactly as the app already holds it — camelCase keys,
  // epoch-millis timestamps — so this direction needs no mapping at all.
  // Ownership comes from auth.uid() server-side; never send user_id.
  async saveDeck(_deck: Deck): Promise<void> {
    return notImplemented();
  },

  // Delete the deck row only. Cards go with it via the deck_id foreign key's
  // on delete cascade — a second call would be redundant.
  async deleteDeck(_id: string): Promise<void> {
    return notImplemented();
  },
};

// ---------------------------------------------------------------------------
// Active store selection.
// App.tsx calls setActiveStore() with the backend that matches the auth state.
// localStore is the default; the exported functions below read `active` on
// every call, so switching stores takes effect immediately.
// ---------------------------------------------------------------------------

let active: StorageBackend = localStore;

export function setActiveStore(store: StorageBackend): void {
  active = store;
}

export function getAllDecks(): Promise<Deck[]> {
  return active.getAllDecks();
}

export function saveDeck(deck: Deck): Promise<void> {
  return active.saveDeck(deck);
}

export function deleteDeck(id: string): Promise<void> {
  return active.deleteDeck(id);
}
