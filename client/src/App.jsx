import React, { useState, useCallback, useEffect } from 'react';
import Lobby from './pages/Lobby';
import Board from './pages/Board';
import socket from './socket';
import { getPlayerId, loadSession, clearSession, saveSession } from './socket';

export default function App() {
  const [screen, setScreen] = useState('loading'); // start as loading to try reconnect
  const [gameState, setGameState] = useState(null);
  const [roomCode, setRoomCode] = useState('');

  // ── Auto-reconnect on mount ──────────────────────────────────
  useEffect(() => {
    const session = loadSession();

    if (session && session.playerId === getPlayerId()) {
      // Try to reconnect to existing session
      socket.emit('RECONNECT', { playerId: session.playerId, roomCode: session.roomCode });

      const onReconnected = ({ state, code, playerId }) => {
        setGameState(state);
        setRoomCode(code);
        setScreen('board');
        cleanup();
      };

      const onReconnectFailed = () => {
        clearSession();
        setScreen('lobby');
        cleanup();
      };

      // If socket isn't connected yet, wait for connect then try
      const onConnect = () => {
        socket.emit('RECONNECT', { playerId: session.playerId, roomCode: session.roomCode });
      };

      socket.on('RECONNECTED', onReconnected);
      socket.on('RECONNECT_FAILED', onReconnectFailed);
      if (!socket.connected) socket.on('connect', onConnect);

      // Timeout fallback — if no response in 3s, go to lobby
      const timeout = setTimeout(() => {
        clearSession();
        setScreen('lobby');
        cleanup();
      }, 3000);

      function cleanup() {
        clearTimeout(timeout);
        socket.off('RECONNECTED', onReconnected);
        socket.off('RECONNECT_FAILED', onReconnectFailed);
        socket.off('connect', onConnect);
      }

      return cleanup;
    } else {
      setScreen('lobby');
    }
  }, []);

  // ── Socket reconnect during gameplay ─────────────────────────
  useEffect(() => {
    if (screen !== 'board') return;

    const handleReconnect = () => {
      const session = loadSession();
      if (session) {
        socket.emit('RECONNECT', { playerId: session.playerId, roomCode: session.roomCode });
      }
    };

    socket.on('connect', handleReconnect);
    return () => socket.off('connect', handleReconnect);
  }, [screen]);

  const handleGameStart = useCallback((state, code) => {
    setGameState(state);
    setRoomCode(code);
    setScreen('board');
  }, []);

  const handleReturnToLobby = useCallback(() => {
    clearSession();
    setGameState(null);
    setRoomCode('');
    setScreen('lobby');
  }, []);

  if (screen === 'loading') {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: '#888' }}>Reconnecting...</div>;
  }

  return (
    <>
      {screen === 'lobby' && <Lobby onGameStart={handleGameStart} />}
      {screen === 'board' && (
        <Board
          initialState={gameState}
          roomCode={roomCode}
          playerId={getPlayerId()}
          onReturnToLobby={handleReturnToLobby}
        />
      )}
    </>
  );
}
