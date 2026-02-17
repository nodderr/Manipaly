import React from 'react';
import './VictoryScreen.css';

export default function VictoryScreen({ winnerName, players, onClose }) {
  return (
    <div className="victory-overlay">
      <div className="victory-dialog">
        <div className="victory__confetti">🎊</div>
        <h2 className="victory__title">🏆 Game Over!</h2>
        <div className="victory__winner">{winnerName}</div>
        <div className="victory__subtitle">wins the game!</div>

        {players && (
          <div className="victory__standings">
            <div className="victory__standings-title">Final Standings</div>
            {players
              .filter((p) => !p.bankrupt)
              .concat(players.filter((p) => p.bankrupt))
              .map((p, i) => (
                <div key={p.id} className={`victory__player ${p.bankrupt ? 'victory__player--bankrupt' : ''}`}>
                  <span className="victory__rank">{p.bankrupt ? '💀' : `#${i + 1}`}</span>
                  <span className="victory__dot" style={{ background: p.color }} />
                  <span className="victory__name">{p.name}</span>
                  <span className="victory__cash">${p.money}</span>
                </div>
              ))}
          </div>
        )}

        <button className="victory__btn" onClick={onClose}>
          Return to Lobby
        </button>
      </div>
    </div>
  );
}
