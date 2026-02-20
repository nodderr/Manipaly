import React, { useState, useMemo } from 'react';
import BOARD_SPACES from '../data/boardSpaces';
import './TradeDialog.css';

export default function TradeDialog({ myId, players, properties, onPropose, onClose }) {
  const [targetId, setTargetId] = useState('');
  const [offerProps, setOfferProps] = useState([]);
  const [wantProps, setWantProps] = useState([]);
  const [offerMoney, setOfferMoney] = useState(0);
  const [wantMoney, setWantMoney] = useState(0);

  const otherPlayers = players.filter((p) => p.id !== myId && !p.bankrupt);
  const target = players.find((p) => p.id === targetId);
  const me = players.find((p) => p.id === myId);

  const myProps = useMemo(() =>
    Object.entries(properties)
      .filter(([, v]) => v.ownerId === myId && v.houses === 0)
      .map(([id]) => {
        const space = BOARD_SPACES.find((s) => s.id === Number(id));
        return { id: Number(id), name: space?.name || `Space ${id}` };
      }),
    [properties, myId]
  );

  const targetProps = useMemo(() =>
    Object.entries(properties)
      .filter(([, v]) => v.ownerId === targetId && v.houses === 0)
      .map(([id]) => {
        const space = BOARD_SPACES.find((s) => s.id === Number(id));
        return { id: Number(id), name: space?.name || `Space ${id}` };
      }),
    [properties, targetId]
  );

  const toggleOffer = (id) => setOfferProps((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  const toggleWant = (id) => setWantProps((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);

  const canPropose = targetId && (offerProps.length > 0 || offerMoney > 0 || wantProps.length > 0 || wantMoney > 0);

  return (
    <div className="trade-overlay" onClick={onClose}>
      <div className="trade-dialog" onClick={(e) => e.stopPropagation()}>
        <h3 className="trade__title">💱 Propose Trade</h3>

        {/* Target selection */}
        <div className="trade__section">
          <label className="trade__label">Trade with:</label>
          <select
            className="trade__select"
            value={targetId}
            onChange={(e) => { setTargetId(e.target.value); setWantProps([]); }}
          >
            <option value="">Select player...</option>
            {otherPlayers.map((p) => (
              <option key={p.id} value={p.id}>{p.name} (₹{p.money})</option>
            ))}
          </select>
        </div>

        {targetId && (
          <>
            {/* What you offer */}
            <div className="trade__column">
              <div className="trade__col-header">🎁 You Offer</div>
              <div className="trade__money-row">
                <span>₹</span>
                <input
                  type="number" min="0" max={me?.money || 0}
                  className="trade__money-input"
                  value={offerMoney}
                  onChange={(e) => setOfferMoney(Math.max(0, Number(e.target.value)))}
                />
              </div>
              <div className="trade__props">
                {myProps.length === 0 && <span className="trade__empty">No properties to offer</span>}
                {myProps.map((p) => (
                  <button
                    key={p.id}
                    className={`trade__prop-btn ${offerProps.includes(p.id) ? 'trade__prop-btn--selected' : ''}`}
                    onClick={() => toggleOffer(p.id)}
                  >
                    {p.name}
                  </button>
                ))}
              </div>
            </div>

            {/* What you want */}
            <div className="trade__column">
              <div className="trade__col-header">🔄 You Want</div>
              <div className="trade__money-row">
                <span>₹</span>
                <input
                  type="number" min="0" max={target?.money || 0}
                  className="trade__money-input"
                  value={wantMoney}
                  onChange={(e) => setWantMoney(Math.max(0, Number(e.target.value)))}
                />
              </div>
              <div className="trade__props">
                {targetProps.length === 0 && <span className="trade__empty">No properties available</span>}
                {targetProps.map((p) => (
                  <button
                    key={p.id}
                    className={`trade__prop-btn ${wantProps.includes(p.id) ? 'trade__prop-btn--selected' : ''}`}
                    onClick={() => toggleWant(p.id)}
                  >
                    {p.name}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        <div className="trade__actions">
          <button className="trade__btn trade__btn--cancel" onClick={onClose}>Cancel</button>
          <button
            className="trade__btn trade__btn--propose"
            disabled={!canPropose}
            onClick={() => onPropose({ targetId, offerProps, offerMoney, wantProps, wantMoney })}
          >
            Propose Trade
          </button>
        </div>
      </div>
    </div>
  );
}

// Incoming trade prompt shown to the target player
export function TradePrompt({ trade, onRespond }) {
  return (
    <div className="trade-overlay">
      <div className="trade-dialog trade-dialog--incoming">
        <h3 className="trade__title">📨 Trade Offer from {trade.fromName}</h3>

        <div className="trade__summary">
          <div className="trade__summary-col">
            <strong>They offer:</strong>
            {trade.offerMoney > 0 && <div className="trade__summary-item">₹{trade.offerMoney}</div>}
            {trade.offerProps.map((id) => {
              const space = BOARD_SPACES.find((s) => s.id === id);
              return <div key={id} className="trade__summary-item">{space?.name || `Space ${id}`}</div>;
            })}
            {trade.offerMoney === 0 && trade.offerProps.length === 0 && <div className="trade__summary-item trade__empty">Nothing</div>}
          </div>
          <div className="trade__summary-arrow">⇄</div>
          <div className="trade__summary-col">
            <strong>They want:</strong>
            {trade.wantMoney > 0 && <div className="trade__summary-item">₹{trade.wantMoney}</div>}
            {trade.wantProps.map((id) => {
              const space = BOARD_SPACES.find((s) => s.id === id);
              return <div key={id} className="trade__summary-item">{space?.name || `Space ${id}`}</div>;
            })}
            {trade.wantMoney === 0 && trade.wantProps.length === 0 && <div className="trade__summary-item trade__empty">Nothing</div>}
          </div>
        </div>

        <div className="trade__actions">
          <button className="trade__btn trade__btn--cancel" onClick={() => onRespond(false)}>❌ Reject</button>
          <button className="trade__btn trade__btn--accept" onClick={() => onRespond(true)}>✅ Accept</button>
        </div>
      </div>
    </div>
  );
}
