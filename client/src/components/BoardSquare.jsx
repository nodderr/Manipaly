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

// Icons for special types
const TYPE_ICONS = {
  chance:   '?',
  chest:    '🏦',
  tax:      '💰',
  railroad: '🚂',
  utility:  '⚡',
  corner:   '',
};

// House display helper
function HouseIcons({ count }) {
  if (!count || count <= 0) return null;
  if (count === 5) return <span className="sq__houses sq__houses--hotel" title="Hotel">🏨</span>;
  return (
    <span className="sq__houses" title={`${count} house(s)`}>
      {'🏠'.repeat(count)}
    </span>
  );
}

export default function BoardSquare({ space, players, edge, owner, ownerColor, onClick }) {
  const groupColor = GROUP_COLORS[space.group] || null;
  const isCorner = space.type === 'corner';
  const isProperty = space.type === 'property';
  const icon = TYPE_ICONS[space.type] || '';
  const isMortgaged = owner?.mortgaged;

  // Corner cells
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

  // Ownership border style
  const ownerBorderStyle = ownerColor ? {
    boxShadow: `inset 0 0 0 2px ${ownerColor}`,
  } : {};

  return (
    <div
      className={`sq sq--${edge} ${clickable ? 'sq--clickable' : ''} ${isMortgaged ? 'sq--mortgaged' : ''}`}
      data-id={space.id}
      onClick={clickable && onClick ? () => onClick(space.id) : undefined}
      style={ownerBorderStyle}
    >
      {/* Color band */}
      {groupColor && (
        <div
          className={`sq__color sq__color--${edge}`}
          style={{ backgroundColor: groupColor }}
        />
      )}

      <div className="sq__body">
        <span className="sq__name">{space.name}</span>

        {/* House icons */}
        {owner && <HouseIcons count={owner.houses} />}

        {!isProperty && icon && (
          <span className="sq__icon">{icon}</span>
        )}

        {space.price && (
          <span className="sq__price">${space.price}</span>
        )}

        {owner && !isMortgaged && (
          <span className="sq__owned" style={{ color: ownerColor || '#c41e3a' }} title={`Owned by ${owner.ownerName}`}>●</span>
        )}

        {isMortgaged && (
          <span className="sq__mortgaged-label" title="Mortgaged">Ⓜ</span>
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
