import React, { useEffect, useState } from 'react';
import './CardDraw.css';

/**
 * Animated card-draw overlay.
 * Props: card { text, deckType ('chance' | 'chest') }, onDone callback
 */
export default function CardDraw({ card, onDone }) {
  const [phase, setPhase] = useState('flip'); // 'flip' → 'show' → 'exit'

  useEffect(() => {
    // Flip animation: 0.6s, then show for 3s, then exit
    const t1 = setTimeout(() => setPhase('show'), 600);
    const t2 = setTimeout(() => setPhase('exit'), 3600);
    const t3 = setTimeout(() => onDone(), 4200);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);

  if (!card) return null;

  const isChance = card.deckType === 'chance';

  return (
    <div className={`card-draw-overlay card-draw--${phase}`}>
      <div className={`card-draw ${isChance ? 'card-draw--chance' : 'card-draw--chest'}`}>
        <div className="card-draw__inner">
          {/* Back face */}
          <div className="card-draw__face card-draw__back">
            <span className="card-draw__back-icon">{isChance ? '❓' : '📦'}</span>
            <span className="card-draw__back-label">{isChance ? 'CHANCE' : 'COMMUNITY CHEST'}</span>
          </div>
          {/* Front face */}
          <div className="card-draw__face card-draw__front">
            <div className="card-draw__header">
              <span className="card-draw__header-icon">{isChance ? '❓' : '📦'}</span>
              <span className="card-draw__header-title">{isChance ? 'Chance' : 'Community Chest'}</span>
            </div>
            <div className="card-draw__text">{card.text}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
