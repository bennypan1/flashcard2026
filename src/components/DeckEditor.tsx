import { useState } from 'react';
import type { Deck, Card } from '../types';
import { CardEditor } from './CardEditor';
import { ConfirmDialog } from './ConfirmDialog';

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
  const [showNoteFor, setShowNoteFor] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [confirm, setConfirm] = useState<{ message: string; confirmLabel: string; onConfirm: () => void } | null>(null);

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function cancelSelect() {
    setSelectedIds(new Set());
  }

  function deleteSelected() {
    const n = selectedIds.size;
    if (n === 0) return;
    setConfirm({
      message: `Delete ${n} card${n !== 1 ? 's' : ''}? This cannot be undone.`,
      confirmLabel: `Delete ${n} card${n !== 1 ? 's' : ''}`,
      onConfirm: async () => {
        await onSave({ ...deck, cards: deck.cards.filter((c) => !selectedIds.has(c.id)) });
        cancelSelect();
        setConfirm(null);
      },
    });
  }

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

  function handleDeleteDeck() {
    setConfirm({
      message: `Delete deck "${deck.name}"? This cannot be undone.`,
      confirmLabel: 'Delete Deck',
      onConfirm: async () => {
        await onDelete();
        setConfirm(null);
      },
    });
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
      {/* Sticky header: deck name row + toolbar row */}
      <div className="deck-editor-sticky">
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

        <div className="deck-editor-toolbar">
          {selectedIds.size > 0 ? (
            <>
              <button className="btn btn-sm btn-danger" onClick={deleteSelected}>
                Delete ({selectedIds.size})
              </button>
              <button className="btn btn-sm btn-solid-gray" onClick={cancelSelect}>
                Cancel
              </button>
            </>
          ) : (
            <>
              <button className="btn btn-sm btn-primary" onClick={() => setEditing({ mode: 'new' })}>
                + Add Card
              </button>
              <button className="btn btn-sm btn-danger" onClick={handleDeleteDeck}>
                Delete Deck
              </button>
            </>
          )}
        </div>
      </div>

      {deck.cards.length === 0 ? (
        <p className="empty-state">No cards yet. Add one below.</p>
      ) : (
        <ul className="card-list">
          {deck.cards.map((card) => {
            const isSelected = selectedIds.has(card.id);
            return (
              <li
                key={card.id}
                className="card-item"
                onClick={() => selectedIds.size > 0 ? toggleSelect(card.id) : setEditing({ mode: 'edit', cardId: card.id })}
              >
                <span
                  className={`card-checkbox${isSelected ? ' card-checkbox-checked' : ''}`}
                  onClick={(e) => { e.stopPropagation(); toggleSelect(card.id); }}
                >
                  {isSelected && '✓'}
                </span>
                <div className={`card-item-card${isSelected ? ' card-item-selected' : ''}`}>
                  <div className="card-item-body">
                    <div className="card-preview-top">
                      <span className="card-preview-english">{card.english}</span>
                      <span className="card-preview-chinese">{card.chinese}</span>
                    </div>
                    <div className="card-preview-bottom">
                      <span className="card-preview-pinyin">{card.pinyin}</span>
                      {card.notes && (
                        <button
                          className={`note-btn${showNoteFor === card.id ? ' note-btn-active' : ''}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowNoteFor((prev) => (prev === card.id ? null : card.id));
                          }}
                        >
                          📝 Note
                        </button>
                      )}
                    </div>
                    {showNoteFor === card.id && (
                      <p className="note-panel">{card.notes}</p>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {confirm && (
        <ConfirmDialog
          message={confirm.message}
          confirmLabel={confirm.confirmLabel}
          onConfirm={confirm.onConfirm}
          onCancel={() => setConfirm(null)}
        />
      )}
    </div>
  );
}
