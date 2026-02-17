import React, { useState, useEffect, useRef } from 'react';
import BoardSquare from '../components/BoardSquare';
import PropertyCard from '../components/PropertyCard';
import PropertiesCarousel from '../components/PropertiesCarousel';
import BOARD_SPACES from '../data/boardSpaces';
import PROPERTY_DETAILS from '../data/propertyDetails';
import socket from '../socket';
import './Board.css';

function getGridPosition(id) {
  if (id <= 10) return { row: 11, col: 11 - id, edge: 'bottom' };
  if (id <= 20) return { row: 11 - (id - 10), col: 1, edge: 'left' };
  if (id <= 30) return { row: 1, col: 1 + (id - 20), edge: 'top' };
  return { row: 1 + (id - 30), col: 11, edge: 'right' };
}

export default function Board({ initialState, roomCode, socketId }) {
  const [players, setPlayers] = useState(initialState.players || []);
  const [currentPlayerId, setCurrentPlayerId] = useState(initialState.currentPlayerId || null);
  const [properties, setProperties] = useState(initialState.properties || {});
  const [dice, setDice] = useState(null);
  const [buyOption, setBuyOption] = useState(null);
  const [hasRolled, setHasRolled] = useState(false);
  const [log, setLog] = useState([]);
  const [error, setError] = useState('');
  const [selectedProperty, setSelectedProperty] = useState(null); // spaceId for PropertyCard popup
  const logRef = useRef(null);

  const isMyTurn = currentPlayerId === socketId;
  const me = players.find((p) => p.id === socketId);

  // Auto-scroll log
  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [log]);

  useEffect(() => {
    socket.on('GAME_STATE_UPDATE', (state) => {
      setPlayers(state.players);
      setCurrentPlayerId(state.currentPlayerId);
      setProperties(state.properties || {});
    });

    socket.on('DICE_ROLLED', (result) => {
      setDice({ die1: result.die1, die2: result.die2 });

      const spaceName = BOARD_SPACES.find((s) => s.id === result.newPosition)?.name || `Space ${result.newPosition}`;
      addLog(`🎲 ${result.playerName} rolled ${result.die1}+${result.die2} = ${result.total}, moved to ${spaceName}`);

      if (result.passedGo) {
        addLog(`💰 ${result.playerName} passed GO — collected $200`);
      }

      if (result.landingAction) {
        const action = result.landingAction;
        if (action.type === 'tax') {
          addLog(`📋 ${result.playerName} paid $${action.amount} in tax`);
        } else if (action.type === 'rent') {
          addLog(`🏠 ${result.playerName} paid $${action.rent} rent to ${action.ownerName}`);
        } else if (action.type === 'buy_option') {
          if (result.playerId === socketId) {
            setBuyOption({ spaceId: action.spaceId, price: action.price, name: spaceName });
          }
        } else if (action.type === 'own_property') {
          addLog(`🏠 ${result.playerName} is on their own property`);
        }
      }

      if (result.playerId === socketId) {
        setHasRolled(true);
      }
    });

    socket.on('PROPERTY_BOUGHT', (result) => {
      const spaceName = BOARD_SPACES.find((s) => s.id === result.spaceId)?.name || `Space ${result.spaceId}`;
      addLog(`🏗️ ${result.ownerName} bought ${spaceName} for $${result.price}`);
      setBuyOption(null);
    });

    socket.on('PASS_ACKNOWLEDGED', () => {
      setBuyOption(null);
    });

    socket.on('TURN_CHANGED', (result) => {
      setCurrentPlayerId(result.currentPlayerId);
      setDice(null);
      setHasRolled(false);
      setBuyOption(null);
      addLog(`➡️ It's now ${result.currentPlayerName}'s turn`);
    });

    socket.on('PLAYER_LEFT', ({ players }) => {
      setPlayers(players);
      addLog(`👋 A player left the game`);
    });

    socket.on('ERROR', ({ message }) => {
      setError(message);
      setTimeout(() => setError(''), 3000);
    });

    return () => {
      socket.off('GAME_STATE_UPDATE');
      socket.off('DICE_ROLLED');
      socket.off('PROPERTY_BOUGHT');
      socket.off('PASS_ACKNOWLEDGED');
      socket.off('TURN_CHANGED');
      socket.off('PLAYER_LEFT');
      socket.off('ERROR');
    };
  }, [socketId]);

  function addLog(msg) {
    setLog((prev) => [...prev.slice(-50), msg]);
  }

  function handleRoll() {
    socket.emit('ROLL_DICE', { code: roomCode });
  }

  function handleBuy() {
    if (buyOption) {
      socket.emit('BUY_PROPERTY', { code: roomCode, spaceId: buyOption.spaceId });
    }
  }

  function handlePass() {
    socket.emit('PASS_PROPERTY', { code: roomCode });
    setBuyOption(null);
  }

  function handleEndTurn() {
    socket.emit('END_TURN', { code: roomCode });
  }

  function handleSquareClick(spaceId) {
    // Only open detail if there's property data for it
    if (PROPERTY_DETAILS[spaceId]) {
      setSelectedProperty(spaceId);
    }
  }

  const currentPlayer = players.find((p) => p.id === currentPlayerId);

  return (
    <div className="game">
      {/* ── Left Panel ──────────────────────────────────────────── */}
      <div className="game__panel">
        <h2 className="game__title">MANIPALY</h2>

        {/* Turn Indicator */}
        <div className="panel__section">
          <div className="panel__turn">
            {currentPlayer && (
              <>
                <span className="panel__dot" style={{ backgroundColor: currentPlayer.color }} />
                <span>
                  {currentPlayer.id === socketId ? "Your turn" : `${currentPlayer.name}'s turn`}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Dice Display */}
        {dice && (
          <div className="panel__section panel__dice">
            <div className="dice">{renderDieFace(dice.die1)}</div>
            <div className="dice">{renderDieFace(dice.die2)}</div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="panel__section panel__actions">
          {isMyTurn && !hasRolled && !buyOption && (
            <button className="btn btn--roll" onClick={handleRoll}>
              🎲 Roll Dice
            </button>
          )}

          {buyOption && (
            <div className="panel__buy">
              <p className="panel__buy-title">Buy {buyOption.name}?</p>
              <p className="panel__buy-price">${buyOption.price}</p>
              <div className="panel__buy-btns">
                <button className="btn btn--buy" onClick={handleBuy}>Buy</button>
                <button className="btn btn--pass" onClick={handlePass}>Pass</button>
              </div>
            </div>
          )}

          {isMyTurn && hasRolled && !buyOption && (
            <button className="btn btn--end" onClick={handleEndTurn}>
              End Turn ➡️
            </button>
          )}
        </div>

        {/* Error */}
        {error && <div className="panel__error">{error}</div>}

        {/* Your Properties Carousel */}
        <div className="panel__section">
          <h3 className="panel__heading">Your Properties</h3>
          <PropertiesCarousel
            properties={properties}
            playerId={socketId}
            onPropertyClick={handleSquareClick}
          />
        </div>

        {/* Players */}
        <div className="panel__section">
          <h3 className="panel__heading">Players</h3>
          <div className="panel__players">
            {players.map((p) => (
              <div
                key={p.id}
                className={`panel__player ${p.id === currentPlayerId ? 'panel__player--active' : ''}`}
              >
                <span className="panel__dot" style={{ backgroundColor: p.color }} />
                <span className="panel__player-name">
                  {p.name}{p.id === socketId ? ' (You)' : ''}
                </span>
                <span className="panel__player-money">${p.money}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Game Log */}
        <div className="panel__section panel__log-section">
          <h3 className="panel__heading">Log</h3>
          <div className="panel__log" ref={logRef}>
            {log.length === 0 && <span className="panel__log-empty">Game started!</span>}
            {log.map((msg, i) => (
              <div key={i} className="panel__log-entry">{msg}</div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Board ──────────────────────────────────────────────── */}
      <div className="game__board">
        <div className="board-grid">
          {BOARD_SPACES.map((space) => {
            const { row, col, edge } = getGridPosition(space.id);
            const onSpace = players.filter((p) => p.position === space.id);
            const owner = properties[space.id];
            return (
              <div
                key={space.id}
                className="board-cell"
                style={{ gridRow: row, gridColumn: col }}
              >
                <BoardSquare
                  space={space}
                  players={onSpace}
                  edge={edge}
                  owner={owner}
                  onClick={handleSquareClick}
                />
              </div>
            );
          })}
          <div className="board-center">
            <div className="board-center__inner">
              <span className="board-center__title">MANIPALY</span>
              <div className="board-center__dice">🎲</div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Property Detail Popup ──────────────────────────────── */}
      {selectedProperty !== null && (
        <PropertyCard
          spaceId={selectedProperty}
          owner={properties[selectedProperty] || null}
          onClose={() => setSelectedProperty(null)}
        />
      )}
    </div>
  );
}

function renderDieFace(value) {
  const faces = ['', '⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];
  return <span className="dice__face">{faces[value]}</span>;
}
