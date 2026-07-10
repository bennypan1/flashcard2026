import { useState } from 'react';
import type { Deck, Card } from '../types';
import { CardEditor } from './CardEditor';

interface Props {
  deck: Deck;
  onBack: () => void;
  onSave: (deck: Deck) => Promise<void>;
  onDelete: () => Promise<void>;
}

type Editing =
  | { mode: 'new' }
  | { mode: 'edit'; cardId: string }
  | null;

export function DeckEditor({ deck, onBack, onSave, onDelete }: Props) {
  const [editing, setEditing] = useState<Editing>(null);
  const [renaming, setRenaming] = useState(false);
  const [pendingName, setPendingName] = useState('');

  function startRename() {
    setPendingName(deck.name);
    setRenaming(true);
  }

  async function commitRename() {
    const name = pendingName.trim();
    if (name && name !== deck.name) {
      await onSave({ ...deck, name });
    }
    setRenaming(false);
  }

  function cancelRename() {
    setRenaming(false);
  }

  async function handleSaveCard(card: Card) {
    const cards =
      editing?.mode === 'new'
        ? [...deck.cards, card]
        : deck.cards.map((c) => (c.id === card.id ? card : c));
    await onSave({ ...deck, cards });
    setEditing(null);
  }

  async function handleDeleteCard(cardId: string) {
    await onSave({ ...deck, cards: deck.cards.filter((c) => c.id !== cardId) });
    setEditing(null);
  }

  async function handleDeleteDeck() {
    if (window.confirm(`Delete deck "${deck.name}"? This cannot be undone.`)) {
      await onDelete();
    }
  }

  // Show card editor when adding or editing a card
  if (editing !== null) {
    const card =
      editing.mode === 'edit'
        ? (deck.cards.find((c) => c.id === editing.cardId) ?? null)
        : null;
    return (
      <CardEditor
        card={card}
        onSave={handleSaveCard}
        onCancel={() => setEditing(null)}
        onDelete={
          editing.mode === 'edit'
            ? () => handleDeleteCard(editing.cardId)
            : undefined
        }
      />
    );
  }

  return (
    <div className="screen">
      <div className="screen-header">
        <button className="btn-icon" onClick={onBack} title="Back">‹</button>
        {renaming ? (
          <div className="rename-row">
            <input
              autoFocus
              className="input input-inline"
              value={pendingName}
              onChange={(e) => setPendingName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') commitRename();
                if (e.key === 'Escape') cancelRename();
              }}
            />
            <button className="btn btn-sm btn-primary" onClick={commitRename}>Save</button>
            <button className="btn btn-sm btn-ghost" onClick={cancelRename}>Cancel</button>
          </div>
        ) : (
          <button className="deck-title-btn" onClick={startRename} title="Rename deck">
            {deck.name} <span className="edit-glyph">✏</span>
          </button>
        )}
      </div>

      {deck.cards.length === 0 ? (
        <p className="empty-state">No cards yet. Add one below.</p>
      ) : (
        <ul className="card-list">
          {deck.cards.map((card) => (
            <li
              key={card.id}
              className="card-item"
              onClick={() => setEditing({ mode: 'edit', cardId: card.id })}
            >
              <div className="card-preview-top">
                <span className="card-preview-english">{card.english}</span>
                <span className="card-preview-chinese">{card.chinese}</span>
              </div>
              <span className="card-preview-pinyin">{card.pinyin}</span>
            </li>
          ))}
        </ul>
      )}

      <div className="deck-editor-footer">
        <button className="btn btn-primary" onClick={() => setEditing({ mode: 'new' })}>
          + Add Card
        </button>
        <button className="btn btn-danger" onClick={handleDeleteDeck}>
          Delete Deck
        </button>
      </div>
    </div>
  );
}
