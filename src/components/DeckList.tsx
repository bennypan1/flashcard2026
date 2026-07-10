import { useState } from 'react';
import type { Deck } from '../types';
import { generateId } from '../utils';

interface Props {
  mode: 'practice' | 'edit';
  decks: Deck[];
  onBack: () => void;
  onSelectDeck: (id: string) => void;
  onSaveDeck: (deck: Deck) => Promise<void>;
  onDeleteDeck: (id: string) => Promise<void>;
}

export function DeckList({ mode, decks, onBack, onSelectDeck, onSaveDeck, onDeleteDeck }: Props) {
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState('');

  async function handleAdd() {
    const name = newName.trim();
    if (!name) return;
    await onSaveDeck({
      id: generateId('deck'),
      name,
      revealOrder: ['english', 'pinyin', 'chinese'],
      cards: [],
      createdAt: Date.now(),
      lastPracticed: null,
    });
    setNewName('');
    setAdding(false);
  }

  function cancelAdd() {
    setNewName('');
    setAdding(false);
  }

  const header = mode === 'practice' ? 'Choose a deck to practice' : 'Edit decks';

  return (
    <div className="screen">
      <div className="screen-header">
        <button className="btn-icon" onClick={onBack} title="Back">‹</button>
        <h2>{header}</h2>
      </div>

      {decks.length === 0 && (
        <p className="empty-state">
          {mode === 'practice'
            ? 'No decks yet. Go to Edit Decks to create one.'
            : 'No decks yet. Add one below.'}
        </p>
      )}

      <ul className="deck-list">
        {decks.map((deck) => (
          <li key={deck.id} className="deck-item">
            <button className="deck-row-btn" onClick={() => onSelectDeck(deck.id)}>
              <span className="deck-name">{deck.name}</span>
              <span className="deck-meta">{deck.cards.length} card{deck.cards.length !== 1 ? 's' : ''}</span>
            </button>
            {mode === 'edit' && (
              <button
                className="btn-icon btn-icon-danger"
                title="Delete deck"
                onClick={() => {
                  if (window.confirm(`Delete "${deck.name}"? This cannot be undone.`)) {
                    onDeleteDeck(deck.id);
                  }
                }}
              >
                ✕
              </button>
            )}
          </li>
        ))}
      </ul>

      {mode === 'edit' && (
        <div className="add-section">
          {adding ? (
            <div className="add-form">
              <input
                autoFocus
                className="input"
                type="text"
                placeholder="Deck name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAdd();
                  if (e.key === 'Escape') cancelAdd();
                }}
              />
              <div className="row-actions">
                <button className="btn btn-primary" onClick={handleAdd}>Add</button>
                <button className="btn btn-ghost" onClick={cancelAdd}>Cancel</button>
              </div>
            </div>
          ) : (
            <button className="btn btn-primary" onClick={() => setAdding(true)}>+ Add Deck</button>
          )}
        </div>
      )}
    </div>
  );
}
