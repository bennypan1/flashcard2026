import { useState, useEffect } from 'react';
import type { Deck } from './types';
import { getAllDecks, saveDeck, deleteDeck as dbDeleteDeck } from './db';
import { Home } from './components/Home';
import { DeckList } from './components/DeckList';
import { DeckEditor } from './components/DeckEditor';
import { PracticeSession } from './components/PracticeSession';

type Screen =
  | { type: 'home' }
  | { type: 'deck-list'; mode: 'practice' | 'edit' }
  | { type: 'deck-editor'; deckId: string }
  | { type: 'practice'; deckId: string };

export function App() {
  const [screen, setScreen] = useState<Screen>({ type: 'home' });
  const [decks, setDecks] = useState<Deck[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAllDecks()
      .then((all) => setDecks(all.sort((a, b) => a.createdAt - b.createdAt)))
      .finally(() => setLoading(false));
  }, []);

  async function handleSaveDeck(deck: Deck) {
    await saveDeck(deck);
    setDecks((prev) => {
      const idx = prev.findIndex((d) => d.id === deck.id);
      if (idx === -1) return [...prev, deck];
      const next = [...prev];
      next[idx] = deck;
      return next;
    });
  }

  async function handleDeleteDeck(id: string) {
    await dbDeleteDeck(id);
    setDecks((prev) => prev.filter((d) => d.id !== id));
    setScreen({ type: 'deck-list', mode: 'edit' });
  }

  if (loading) return <div className="loading">Loading…</div>;

  switch (screen.type) {
    case 'home':
      return (
        <Home
          onStart={() => setScreen({ type: 'deck-list', mode: 'practice' })}
          onEditDecks={() => setScreen({ type: 'deck-list', mode: 'edit' })}
        />
      );

    case 'deck-list':
      return (
        <DeckList
          mode={screen.mode}
          decks={decks}
          onBack={() => setScreen({ type: 'home' })}
          onSelectDeck={(id) =>
            setScreen(
              screen.mode === 'practice'
                ? { type: 'practice', deckId: id }
                : { type: 'deck-editor', deckId: id }
            )
          }
          onSaveDeck={handleSaveDeck}
          onDeleteDeck={handleDeleteDeck}
        />
      );

    case 'deck-editor': {
      const deck = decks.find((d) => d.id === screen.deckId);
      if (!deck) return null;
      return (
        <DeckEditor
          key={screen.deckId}
          deck={deck}
          onBack={() => setScreen({ type: 'deck-list', mode: 'edit' })}
          onSave={handleSaveDeck}
          onDelete={() => handleDeleteDeck(deck.id)}
        />
      );
    }

    case 'practice': {
      const deck = decks.find((d) => d.id === screen.deckId);
      if (!deck) return null;
      return (
        <PracticeSession
          deck={deck}
          onExit={() => setScreen({ type: 'deck-list', mode: 'practice' })}
          onSaveDeck={handleSaveDeck}
        />
      );
    }
  }
}
