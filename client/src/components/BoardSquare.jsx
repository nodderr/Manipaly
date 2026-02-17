import React from 'react';
import PlayerToken from './PlayerToken';
import './BoardSquare.css';

// Classic Monopoly color mapping
const GROUP_COLORS = {
  brown:     '#8B4513',
  lightblue: '#AAD8E6',
  pink:      '#D93A96',
  orange:    '#F7941D',
  red:       '#ED1B24',
  yellow:    '#FDEF44',
  green:     '#1FB25A',
  darkblue:  '#0072BB',
  railroad:  '#000',
  utility:   '#000',
};

// Icons / symbols for special types
const TYPE_ICONS = {
  chance:   '?',
  chest:    '🏦',
  tax:      '💰',
  railroad: '🚂',
  utility:  '⚡',
  corner:   '',
};

export default function BoardSquare({ space, players, edge, owner, onClick }) {
  const groupColor = GROUP_COLORS[space.group] || null;
  const isCorner = space.type === 'corner';
  const isProperty = space.type === 'property';
  const icon = TYPE_ICONS[space.type] || '';

  // Corner cells get a different layout
  if (isCorner) {
    return (
      <div className={`sq sq--corner sq--${edge}`} data-id={space.id}>
        <div className="sq__corner-content">
          <span className="sq__corner-name">{space.name}</span>
          {space.id === 0 && <span className="sq__corner-icon">←</span>}
          {space.id === 10 && <span className="sq__corner-sub">Visit</span>}
          {space.id === 20 && <span className="sq__corner-icon">🅿️</span>}
          {space.id === 30 && <span className="sq__corner-icon">👮</span>}
        </div>
        {players.length > 0 && (
          <div className="sq__tokens">
            {players.map((p) => (
              <PlayerToken key={p.id} color={p.color} name={p.name} />
            ))}
          </div>
        )}
      </div>
    );
  }

  const clickable = space.type === 'property' || space.type === 'railroad' || space.type === 'utility';

  return (
    <div
      className={`sq sq--${edge} ${clickable ? 'sq--clickable' : ''}`}
      data-id={space.id}
      onClick={clickable && onClick ? () => onClick(space.id) : undefined}
    >
      {/* Color band — on the inner edge */}
      {groupColor && (
        <div
          className={`sq__color sq__color--${edge}`}
          style={{ backgroundColor: groupColor }}
        />
      )}

      <div className="sq__body">
        <span className="sq__name">{space.name}</span>

        {!isProperty && icon && (
          <span className="sq__icon">{icon}</span>
        )}

        {space.price && (
          <span className="sq__price">${space.price}</span>
        )}

        {owner && (
          <span className="sq__owned" title={`Owned by ${owner.ownerName}`}>●</span>
        )}
      </div>

      {players.length > 0 && (
        <div className="sq__tokens">
          {players.map((p) => (
            <PlayerToken key={p.id} color={p.color} name={p.name} />
          ))}
        </div>
      )}
    </div>
  );
}
