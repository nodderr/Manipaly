import React, { useState, useCallback } from 'react';
import Lobby from './pages/Lobby';
import Board from './pages/Board';
import socket from './socket';

export default function App() {
  const [screen, setScreen] = useState('lobby');
  const [gameState, setGameState] = useState(null);
  const [roomCode, setRoomCode] = useState('');

  const handleGameStart = useCallback((state, code) => {
    setGameState(state);
    setRoomCode(code);
    setScreen('board');
  }, []);

  return (
    <>
      {screen === 'lobby' && <Lobby onGameStart={handleGameStart} />}
      {screen === 'board' && (
        <Board
          initialState={gameState}
          roomCode={roomCode}
          socketId={socket.id}
        />
      )}
    </>
  );
}
