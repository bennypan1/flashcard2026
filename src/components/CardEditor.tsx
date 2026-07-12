import { useState } from 'react';
import type { Card } from '../types';
import { generateId } from '../utils';
import { ConfirmDialog } from './ConfirmDialog';

interface Props {
  card: Card | null; // null = new card
  onSave: (card: Card) => Promise<void>;
  onCancel: () => void;
  onDelete?: () => Promise<void>;
}

export function CardEditor({ card, onSave, onCancel, onDelete }: Props) {
  const [english, setEnglish] = useState(card?.english ?? '');
  const [pinyin, setPinyin] = useState(card?.pinyin ?? '');
  const [chinese, setChinese] = useState(card?.chinese ?? '');
  const [notes, setNotes] = useState(card?.notes ?? '');

  const isNew = card === null;
  const [showConfirm, setShowConfirm] = useState(false);

  async function handleSave() {
    const saved: Card = isNew
      ? {
          id: generateId('card'),
          english: english.trim(),
          pinyin: pinyin.trim(),
          chinese: chinese.trim(),
          notes: notes.trim(),
          createdAt: Date.now(),
          lastReviewed: null,
          srs: { nextDue: null, interval: 0, ease: 2.5 },
        }
      : {
          ...card,
          english: english.trim(),
          pinyin: pinyin.trim(),
          chinese: chinese.trim(),
          notes: notes.trim(),
        };
    await onSave(saved);
  }


  return (
    <div className="screen">
      <div className="screen-header">
        <button className="btn-icon" onClick={onCancel} title="Back">‹</button>
        <h2>{isNew ? 'New Card' : 'Edit Card'}</h2>
      </div>

      <div className="card-form">
        <div className="form-group">
          <label className="form-label">English</label>
          <input
            autoFocus
            className="input"
            type="text"
            value={english}
            onChange={(e) => setEnglish(e.target.value)}
            placeholder="e.g. hello"
          />
        </div>
        <div className="form-group">
          <label className="form-label">Pinyin</label>
          <input
            className="input"
            type="text"
            value={pinyin}
            onChange={(e) => setPinyin(e.target.value)}
            placeholder="e.g. nǐ hǎo"
          />
        </div>
        <div className="form-group">
          <label className="form-label">Chinese</label>
          <input
            className="input input-chinese"
            type="text"
            value={chinese}
            onChange={(e) => setChinese(e.target.value)}
            placeholder="e.g. 你好"
          />
        </div>
        <div className="form-group">
          <label className="form-label">
            Notes <span className="label-hint">(optional)</span>
          </label>
          <textarea
            className="input input-textarea"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Example sentence, mnemonic, etc."
            rows={3}
          />
        </div>
      </div>

      <div className="row-actions">
        <button className="btn btn-primary" onClick={handleSave}>Save</button>
        <button className="btn btn-ghost" onClick={onCancel}>Cancel</button>
        {onDelete && (
          <button className="btn btn-danger" onClick={() => setShowConfirm(true)}>Delete</button>
        )}
      </div>

      {showConfirm && (
        <ConfirmDialog
          message="Delete this card? This cannot be undone."
          confirmLabel="Delete Card"
          onConfirm={async () => { setShowConfirm(false); await onDelete!(); }}
          onCancel={() => setShowConfirm(false)}
        />
      )}
    </div>
  );
}
