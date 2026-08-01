import type { Deck } from './types';

// Storage interface (spec.md → Backend → Storage interface).
// db.ts exposes a stable shape — getAllDecks / saveDeck / deleteDeck — backed by
// one of two interchangeable implementations, selected by App.tsx based on auth
// state. No component ever talks to IndexedDB or Supabase directly; they only
// call the three exported functions below, which delegate to the active store.
export interface StorageBackend {
  getAllDecks(): Promise<Deck[]>;
  saveDeck(deck: Deck): Promise<void>;
  deleteDeck(id: string): Promise<void>;
}

// ---------------------------------------------------------------------------
// localStore — browser-local IndexedDB. Used for guests. (Unchanged behavior.)
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
// remoteStore — Supabase-backed. Used once signed in; becomes the sole source
// of truth for that account (no offline cache, no dual-write, no merge logic).
// Designed but NOT YET IMPLEMENTED — see spec.md → Backend. Kept as a stub so
// the seam exists and the selector below is real; the guest path never hits it.
// ---------------------------------------------------------------------------

function notImplemented(): never {
  throw new Error('remoteStore is not implemented yet — see spec.md → Backend');
}

export const remoteStore: StorageBackend = {
  async getAllDecks() {
    return notImplemented();
  },
  async saveDeck(_deck: Deck) {
    return notImplemented();
  },
  async deleteDeck(_id: string) {
    return notImplemented();
  },
};

// ---------------------------------------------------------------------------
// Active store selection.
// App.tsx picks the backend based on auth state via setActiveStore(). Defaults
// to localStore (guest) — the only path reachable today, since auth isn't built
// yet. The three exported functions always delegate to whichever store is active,
// so every call site is unaffected by which implementation is in use.
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
