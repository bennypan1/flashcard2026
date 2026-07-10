export interface SRS {
  nextDue: number | null;
  interval: number;
  ease: number;
}

export interface Card {
  id: string;
  english: string;
  pinyin: string;
  chinese: string;
  notes: string;
  createdAt: number;
  lastReviewed: number | null;
  srs: SRS;
}

export interface Deck {
  id: string;
  name: string;
  revealOrder: string[];
  cards: Card[];
  createdAt: number;
  lastPracticed: number | null;
}
