interface Props {
  onStart: () => void;
  onEditDecks: () => void;
}

export function Home({ onStart, onEditDecks }: Props) {
  return (
    <div className="home">
      <h1 className="app-title">闪卡</h1>
      <p className="app-subtitle">Chinese vocabulary flashcards</p>
      <div className="home-buttons">
        <button className="btn btn-primary btn-large" onClick={onStart}>
          Start
        </button>
        <button className="btn btn-secondary btn-large" onClick={onEditDecks}>
          Edit Decks
        </button>
      </div>
    </div>
  );
}
