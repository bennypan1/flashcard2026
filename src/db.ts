import type { Deck } from './types';

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
