import React, { useState, useEffect, useRef, useCallback } from 'react';
import socket from '../socket';
import { getPlayerId, saveSession, clearSession } from '../socket';
import './Lobby.css';

export default function Lobby({ onGameStart }) {
  const [name, setName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [players, setPlayers] = useState([]);
  const [hostId, setHostId] = useState(null);
  const [error, setError] = useState('');
  const [inRoom, setInRoom] = useState(false);
  const [pgnInput, setPgnInput] = useState('');
  const [pgnSlots, setPgnSlots] = useState(null);
  const [isPgnRoom, setIsPgnRoom] = useState(false);

  // ── Refs to avoid stale closures in socket handlers ─────────
  const nameRef = useRef(name);
  const roomCodeRef = useRef(roomCode);
  const joinCodeRef = useRef(joinCode);
  nameRef.current = name;
  roomCodeRef.current = roomCode;
  joinCodeRef.current = joinCode;

  // ── Stable socket listeners (registered ONCE) ──────────────
  useEffect(() => {
    function handleRoomCreated({ code, players, hostId }) {
      setRoomCode(code);
      roomCodeRef.current = code;
      setPlayers(players);
      setHostId(hostId);
      setInRoom(true);
      setError('');
      saveSession(code, nameRef.current.trim());
    }

    function handlePlayerJoined({ players, hostId }) {
      setPlayers(players);
      setHostId(hostId);
      setInRoom(true);
      setError('');
    }

    function handlePlayerLeft({ players, hostId }) {
      setPlayers(players);
      if (hostId !== undefined) setHostId(hostId);
    }

    function handlePlayerDisconnected({ playerId: pid, players: updatedPlayers }) {
      setPlayers(updatedPlayers);
    }

    function handleGameStart(state) {
      const code = roomCodeRef.current || joinCodeRef.current;
      saveSession(code, nameRef.current.trim());
      onGameStart(state, code);
    }

    function handleError({ message }) {
      setError(message);
    }

    function handlePgnRoomCreated({ code, players, hostId, pgnSlots }) {
      setRoomCode(code);
      roomCodeRef.current = code;
      setPlayers(players);
      setHostId(hostId);
      setPgnSlots(pgnSlots);
      setIsPgnRoom(true);
      setInRoom(true);
      setError('');
      saveSession(code, nameRef.current.trim());
    }

    function handlePgnPlayerJoined({ players, hostId, pgnSlots }) {
      setPlayers(players);
      setHostId(hostId);
      setPgnSlots(pgnSlots);
      setIsPgnRoom(true);
      setInRoom(true);
      setError('');
    }

    socket.on('ROOM_CREATED', handleRoomCreated);
    socket.on('PLAYER_JOINED', handlePlayerJoined);
    socket.on('PLAYER_LEFT', handlePlayerLeft);
    socket.on('PLAYER_DISCONNECTED', handlePlayerDisconnected);
    socket.on('PLAYER_RECONNECTED', () => {});
    socket.on('GAME_START', handleGameStart);
    socket.on('ERROR', handleError);
    socket.on('PGN_ROOM_CREATED', handlePgnRoomCreated);
    socket.on('PGN_PLAYER_JOINED', handlePgnPlayerJoined);

    return () => {
      socket.off('ROOM_CREATED', handleRoomCreated);
      socket.off('PLAYER_JOINED', handlePlayerJoined);
      socket.off('PLAYER_LEFT', handlePlayerLeft);
      socket.off('PLAYER_DISCONNECTED', handlePlayerDisconnected);
      socket.off('PLAYER_RECONNECTED');
      socket.off('GAME_START', handleGameStart);
      socket.off('ERROR', handleError);
      socket.off('PGN_ROOM_CREATED', handlePgnRoomCreated);
      socket.off('PGN_PLAYER_JOINED', handlePgnPlayerJoined);
    };
  }, [onGameStart]);

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
    const code = joinCode.toUpperCase();
    setRoomCode(code);
    roomCodeRef.current = code;
    socket.emit('JOIN_ROOM', { code, name: name.trim(), playerId: getPlayerId() });
  };

  const handleStart = () => {
    socket.emit('START_GAME', { code: roomCodeRef.current });
  };

  const handleLeave = () => {
    socket.emit('LEAVE_ROOM', { code: roomCodeRef.current });
    setInRoom(false);
    setRoomCode('');
    roomCodeRef.current = '';
    setPlayers([]);
    setHostId(null);
    setPgnSlots(null);
    setIsPgnRoom(false);
    setError('');
    clearSession();
  };

  const handleLoadPGN = () => {
    if (!name.trim()) {
      setError('Enter your display name first.');
      return;
    }
    if (!pgnInput.trim()) {
      setError('Paste a PGN code to load.');
      return;
    }
    socket.emit('LOAD_PGN', { pgn: pgnInput.trim(), name: name.trim(), playerId: getPlayerId() });
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

              <div className="lobby__divider">
                <span>or load saved game</span>
              </div>

              <div className="lobby__pgn-section">
                <textarea
                  className="lobby__input lobby__input--pgn"
                  placeholder="Paste PGN code here..."
                  value={pgnInput}
                  onChange={(e) => setPgnInput(e.target.value)}
                  rows={3}
                />
                <button className="lobby__btn lobby__btn--load" onClick={handleLoadPGN}>
                  💾 Load Game
                </button>
              </div>
            </div>
          </>
        ) : isPgnRoom && pgnSlots ? (
          <>
            {/* PGN Room Info */}
            <div className="lobby__room-info">
              <span className="lobby__room-label">Room Code</span>
              <span className="lobby__room-code">{roomCode}</span>
              <span className="lobby__room-hint">Share this code. Players must join with their original name.</span>
            </div>

            {/* PGN Slot List */}
            <div className="lobby__players">
              <h3 className="lobby__players-title">
                Waiting for Players ({pgnSlots.filter(s => s.joined).length}/{pgnSlots.length})
              </h3>
              <ul className="lobby__player-list">
                {pgnSlots.map((slot, i) => (
                  <li key={i} className={`lobby__player-item ${slot.joined ? '' : 'lobby__player-item--pending'}`}>
                    <span className={`lobby__pgn-status ${slot.joined ? 'lobby__pgn-status--joined' : ''}`}>
                      {slot.joined ? '✓' : '○'}
                    </span>
                    <span className="lobby__player-name">{slot.name}</span>
                    {slot.joined && (
                      <span className="lobby__player-badge lobby__player-badge--joined">JOINED</span>
                    )}
                    {!slot.joined && (
                      <span className="lobby__player-badge lobby__player-badge--waiting">WAITING</span>
                    )}
                  </li>
                ))}
              </ul>
            </div>

            <div className="lobby__waiting">
              <div className="lobby__waiting-spinner" />
              Game will auto-start when all players join...
            </div>

            <button className="lobby__btn lobby__btn--leave" onClick={handleLeave}>
              🚪 Leave Room
            </button>
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

            <button className="lobby__btn lobby__btn--leave" onClick={handleLeave}>
              🚪 Leave Room
            </button>
          </>
        )}
      </div>
    </div>
  );
}
