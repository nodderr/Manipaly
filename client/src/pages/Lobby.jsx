import React, { useState, useEffect } from 'react';
import socket from '../socket';
import { getPlayerId, saveSession } from '../socket';
import './Lobby.css';

export default function Lobby({ onGameStart }) {
  const [name, setName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [players, setPlayers] = useState([]);
  const [hostId, setHostId] = useState(null);
  const [error, setError] = useState('');
  const [inRoom, setInRoom] = useState(false);

  useEffect(() => {
    // ── Socket listeners ──────────────────────────────────────
    socket.on('ROOM_CREATED', ({ code, players, hostId }) => {
      setRoomCode(code);
      setPlayers(players);
      setHostId(hostId);
      setInRoom(true);
      setError('');
      saveSession(code, name.trim());
    });

    socket.on('PLAYER_JOINED', ({ players, hostId }) => {
      setPlayers(players);
      setHostId(hostId);
      setInRoom(true);
      setError('');
    });

    socket.on('PLAYER_LEFT', ({ players, hostId }) => {
      setPlayers(players);
      setHostId(hostId);
    });

    socket.on('PLAYER_DISCONNECTED', ({ playerId: pid, players: updatedPlayers }) => {
      setPlayers(updatedPlayers);
    });

    socket.on('PLAYER_RECONNECTED', ({ playerId: pid }) => {
      // Will get full update from GAME_STATE_UPDATE
    });

    socket.on('GAME_START', (state) => {
      saveSession(roomCode || joinCode, name.trim());
      onGameStart(state, roomCode || joinCode);
    });

    socket.on('ERROR', ({ message }) => {
      setError(message);
    });

    return () => {
      socket.off('ROOM_CREATED');
      socket.off('PLAYER_JOINED');
      socket.off('PLAYER_LEFT');
      socket.off('PLAYER_DISCONNECTED');
      socket.off('PLAYER_RECONNECTED');
      socket.off('GAME_START');
      socket.off('ERROR');
    };
  }, [onGameStart, roomCode, joinCode]);

  const handleCreate = () => {
    if (!name.trim()) {
      setError('Enter your display name first.');
      return;
    }
    socket.emit('CREATE_ROOM', { name: name.trim(), playerId: getPlayerId() });
  };

  const handleJoin = () => {
    if (!name.trim()) {
      setError('Enter your display name first.');
      return;
    }
    if (!joinCode.trim()) {
      setError('Enter a room code.');
      return;
    }
    setRoomCode(joinCode.toUpperCase());
    socket.emit('JOIN_ROOM', { code: joinCode.toUpperCase(), name: name.trim(), playerId: getPlayerId() });
  };

  const handleStart = () => {
    socket.emit('START_GAME', { code: roomCode });
  };

  const isHost = getPlayerId() === hostId;

  return (
    <div className="lobby">
      <div className="lobby__card">
        {/* Header */}
        <div className="lobby__header">
          <h1 className="lobby__title">
            <span className="lobby__title-icon">🎲</span>
            Manipaly
          </h1>
          <p className="lobby__subtitle">Multiplayer Board Game</p>
        </div>

        {/* Error */}
        {error && (
          <div className="lobby__error">
            <span>⚠</span> {error}
          </div>
        )}

        {!inRoom ? (
          <>
            {/* Name Input */}
            <div className="lobby__section">
              <label className="lobby__label">Display Name</label>
              <input
                className="lobby__input"
                type="text"
                placeholder="Enter your name..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={20}
              />
            </div>

            {/* Actions */}
            <div className="lobby__actions">
              <button className="lobby__btn lobby__btn--primary" onClick={handleCreate}>
                <span>✦</span> Create Room
              </button>

              <div className="lobby__divider">
                <span>or join existing</span>
              </div>

              <div className="lobby__join-row">
                <input
                  className="lobby__input lobby__input--code"
                  type="text"
                  placeholder="ROOM CODE"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  maxLength={5}
                />
                <button className="lobby__btn lobby__btn--secondary" onClick={handleJoin}>
                  Join
                </button>
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Room Info */}
            <div className="lobby__room-info">
              <span className="lobby__room-label">Room Code</span>
              <span className="lobby__room-code">{roomCode}</span>
              <span className="lobby__room-hint">Share this code with friends</span>
            </div>

            {/* Player List */}
            <div className="lobby__players">
              <h3 className="lobby__players-title">
                Players ({players.length}/8)
              </h3>
              <ul className="lobby__player-list">
                {players.map((p) => (
                  <li key={p.id} className="lobby__player-item">
                    <span
                      className="lobby__player-dot"
                      style={{ backgroundColor: p.color }}
                    />
                    <span className="lobby__player-name">{p.name}</span>
                    {p.id === hostId && (
                      <span className="lobby__player-badge">HOST</span>
                    )}
                  </li>
                ))}
              </ul>
            </div>

            {/* Start Button */}
            {isHost && (
              <button
                className="lobby__btn lobby__btn--start"
                onClick={handleStart}
                disabled={players.length < 2}
              >
                🚀 Start Game
                {players.length < 2 && (
                  <span className="lobby__btn-hint">Need 2+ players</span>
                )}
              </button>
            )}

            {!isHost && (
              <div className="lobby__waiting">
                <div className="lobby__waiting-spinner" />
                Waiting for host to start...
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
