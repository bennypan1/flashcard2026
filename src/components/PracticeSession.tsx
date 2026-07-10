import { useState, useEffect, useCallback } from 'react';
import type { Deck, Card } from '../types';
import { shuffle } from '../utils';

interface Props {
  deck: Deck;
  onExit: () => void;
}

interface SessionState {
  cardIds: string[];
  currentIndex: number;
  currentStage: number;
  done: boolean;
}

const FACE_LABELS: Record<string, string> = {
  english: 'English',
  pinyin: 'Pinyin',
  chinese: 'Chinese',
  notes: 'Notes',
};

function getField(card: Card, field: string): string {
  const val = card[field as keyof Card];
  return typeof val === 'string' ? val : '';
}

function makeSession(deck: Deck): SessionState {
  return {
    cardIds: shuffle(deck.cards.map((c) => c.id)),
    currentIndex: 0,
    currentStage: 0,
    done: false,
  };
}

export function PracticeSession({ deck, onExit }: Props) {
  const [session, setSession] = useState<SessionState>(() => makeSession(deck));

  const L = deck.revealOrder.length;
  const N = session.cardIds.length;

  const advance = useCallback(() => {
    setSession((prev) => {
      if (prev.done) return prev;
      const { currentIndex: i, currentStage: s } = prev;
      if (s < L - 1) return { ...prev, currentStage: s + 1 };
      if (i < N - 1) return { ...prev, currentIndex: i + 1, currentStage: 0 };
      return { ...prev, done: true };
    });
  }, [L, N]);

  const goBack = useCallback(() => {
    setSession((prev) => {
      if (prev.done) {
        // inverse of advancing from last card's last face → done
        return { ...prev, done: false, currentIndex: N - 1, currentStage: L - 1 };
      }
      const { currentIndex: i, currentStage: s } = prev;
      if (s > 0) return { ...prev, currentStage: s - 1 };
      if (i > 0) return { ...prev, currentIndex: i - 1, currentStage: L - 1 };
      return prev; // already at very start — no-op
    });
  }, [L, N]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault();
        advance();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        goBack();
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [advance, goBack]);

  // Empty deck guard
  if (N === 0) {
    return (
      <div className="practice-shell">
        <div className="practice-header">
          <button className="btn-icon" onClick={onExit} title="Exit">‹</button>
          <span className="practice-deck-name">{deck.name}</span>
          <span />
        </div>
        <div className="practice-center">
          <p className="empty-state">This deck has no cards.</p>
          <button className="btn btn-ghost" onClick={onExit}>Go back</button>
        </div>
      </div>
    );
  }

  // Done screen
  if (session.done) {
    return (
      <div className="practice-shell">
        <div className="practice-header">
          <button className="btn-icon" onClick={onExit} title="Exit">‹</button>
          <span className="practice-deck-name">{deck.name}</span>
          <span className="practice-progress">{N} / {N}</span>
        </div>
        <div className="practice-center">
          <div className="done-badge">✓</div>
          <h2 className="done-heading">Done!</h2>
          <p className="done-sub">You reviewed all {N} card{N !== 1 ? 's' : ''}.</p>
          <button
            className="btn btn-primary btn-large"
            onClick={() => setSession(makeSession(deck))}
          >
            Practice Again
          </button>
          <button className="btn btn-ghost" onClick={onExit}>Back to Decks</button>
        </div>
      </div>
    );
  }

  const cardId = session.cardIds[session.currentIndex];
  const card = deck.cards.find((c) => c.id === cardId);
  if (!card) return null;

  const revealedFaces = deck.revealOrder.slice(0, session.currentStage + 1);
  const isFullyRevealed = session.currentStage === L - 1;

  const hint = isFullyRevealed
    ? session.currentIndex < N - 1
      ? 'Tap or → for next card'
      : 'Tap or → to finish'
    : 'Tap or → to reveal next';

  return (
    <div className="practice-shell">
      {/* Header */}
      <div className="practice-header">
        <button className="btn-icon" onClick={onExit} title="Exit">‹</button>
        <span className="practice-deck-name">{deck.name}</span>
        <span className="practice-progress">
          {session.currentIndex + 1} / {N}
        </span>
      </div>

      {/* Card area — tap to advance */}
      <div className="practice-card-area" onClick={advance}>
        <div className="practice-faces">
          {revealedFaces.map((face, idx) => (
            <div
              key={face}
              className={`practice-face${idx === revealedFaces.length - 1 ? ' practice-face-new' : ''}`}
            >
              <span className="face-label">{FACE_LABELS[face] ?? face}</span>
              <span className={`face-value${face === 'chinese' ? ' face-value-chinese' : ''}`}>
                {getField(card, face)}
              </span>
            </div>
          ))}
        </div>
        <p className="practice-hint">{hint}</p>
      </div>

      {/* Nav buttons */}
      <div className="practice-nav">
        <button
          className="btn-circle"
          onClick={(e) => { e.stopPropagation(); goBack(); }}
          title="Go back (←)"
        >
          ←
        </button>
        <button
          className="btn-circle btn-circle-primary"
          onClick={(e) => { e.stopPropagation(); advance(); }}
          title="Advance (→)"
        >
          →
        </button>
      </div>
    </div>
  );
}
