import React from 'react';
import './PlayerToken.css';

export default function PlayerToken({ color, name }) {
  return (
    <div
      className="player-token"
      style={{ backgroundColor: color }}
      title={name}
    >
      <span className="player-token__initial">
        {name?.charAt(0).toUpperCase()}
      </span>
    </div>
  );
}
