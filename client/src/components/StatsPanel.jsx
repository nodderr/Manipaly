import React, { useState, useMemo } from 'react';
import BOARD_SPACES from '../data/boardSpaces';
import PROPERTY_DETAILS from '../data/propertyDetails';
import './StatsPanel.css';

export default function StatsPanel({ players, properties, myId }) {
  const [open, setOpen] = useState(false);

  const stats = useMemo(() => {
    return players.filter((p) => !p.bankrupt).map((p) => {
      let propValue = 0;
      let houseValue = 0;
      let propCount = 0;

      for (const [spaceId, prop] of Object.entries(properties)) {
        if (prop.ownerId !== p.id) continue;
        propCount++;
        const details = PROPERTY_DETAILS[spaceId];
        if (details) {
          propValue += prop.mortgaged ? 0 : details.price;
          if (prop.houses > 0 && details.houseCost) {
            houseValue += prop.houses * details.houseCost;
          }
        }
      }

      return {
        id: p.id,
        name: p.name,
        color: p.color,
        cash: p.money,
        propValue,
        houseValue,
        propCount,
        netWorth: p.money + propValue + houseValue,
      };
    }).sort((a, b) => b.netWorth - a.netWorth);
  }, [players, properties]);

  return (
    <div className="stats-panel">
      <button className="stats__toggle" onClick={() => setOpen(!open)}>
        📊 Stats {open ? '▾' : '▸'}
      </button>

      {open && (
        <div className="stats__body">
          <table className="stats__table">
            <thead>
              <tr>
                <th>Player</th>
                <th>Cash</th>
                <th>Props</th>
                <th>Net Worth</th>
              </tr>
            </thead>
            <tbody>
              {stats.map((s) => (
                <tr key={s.id} className={s.id === myId ? 'stats__row--me' : ''}>
                  <td>
                    <span className="stats__dot" style={{ background: s.color }} />
                    {s.name}
                  </td>
                  <td className="stats__money">₹{s.cash}</td>
                  <td>{s.propCount}</td>
                  <td className="stats__networth">₹{s.netWorth}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
