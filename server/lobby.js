// ─── Lobby Socket Event Handlers ────────────────────────────────
import {
  createRoom, joinRoom, disconnectPlayer, reconnectPlayer,
  getRoom, startGame, getGameState, getPlayerIdFromSocket,
} from './gameState.js';

export function registerLobbyHandlers(io, socket) {
  socket.on('CREATE_ROOM', ({ name, playerId }) => {
    if (!name || name.trim().length === 0) {
      socket.emit('ERROR', { message: 'Display name is required.' });
      return;
    }
    if (!playerId) {
      socket.emit('ERROR', { message: 'Player ID is required.' });
      return;
    }
    const room = createRoom(playerId, socket.id, name.trim());
    socket.join(room.code);
    console.log(`[ROOM] ${name} created room ${room.code}`);
    socket.emit('ROOM_CREATED', {
      code: room.code,
      players: room.players,
      hostId: room.hostId,
    });
  });

  socket.on('JOIN_ROOM', ({ code, name, playerId }) => {
    if (!name || name.trim().length === 0) {
      socket.emit('ERROR', { message: 'Display name is required.' });
      return;
    }
    if (!code || code.trim().length === 0) {
      socket.emit('ERROR', { message: 'Room code is required.' });
      return;
    }
    if (!playerId) {
      socket.emit('ERROR', { message: 'Player ID is required.' });
      return;
    }
    const result = joinRoom(code.toUpperCase(), playerId, socket.id, name.trim());
    if (!result.success) {
      socket.emit('ERROR', { message: result.error });
      return;
    }
    socket.join(result.room.code);
    console.log(`[ROOM] ${name} joined room ${result.room.code}`);
    io.to(result.room.code).emit('PLAYER_JOINED', {
      players: result.room.players,
      hostId: result.room.hostId,
    });
  });

  socket.on('START_GAME', ({ code }) => {
    const room = getRoom(code);
    if (!room) { socket.emit('ERROR', { message: 'Room not found.' }); return; }
    const playerId = getPlayerIdFromSocket(socket.id);
    if (room.hostId !== playerId) { socket.emit('ERROR', { message: 'Only the host can start.' }); return; }
    if (room.players.length < 2) { socket.emit('ERROR', { message: 'Need 2+ players.' }); return; }

    const startedRoom = startGame(code);
    console.log(`[GAME] Room ${code} started with ${startedRoom.players.length} players`);

    const state = getGameState(code);
    io.to(code).emit('GAME_START', state);
  });

  // ── Reconnect ─────────────────────────────────────────────────
  socket.on('RECONNECT', ({ playerId, roomCode }) => {
    if (!playerId || !roomCode) {
      socket.emit('RECONNECT_FAILED', { message: 'Invalid session.' });
      return;
    }
    const result = reconnectPlayer(playerId, socket.id);
    if (!result.success) {
      socket.emit('RECONNECT_FAILED', { message: result.error });
      return;
    }

    socket.join(result.code);
    console.log(`[RECONNECT] Player ${playerId} reconnected to room ${result.code}`);

    const state = getGameState(result.code);
    socket.emit('RECONNECTED', { state, code: result.code, playerId });

    // Notify other players
    socket.to(result.code).emit('PLAYER_RECONNECTED', { playerId });
  });

  socket.on('disconnect', () => {
    const result = disconnectPlayer(socket.id);
    if (!result) return;

    if (result.permanent) {
      // Lobby disconnect — removed immediately
      console.log(`[ROOM] Player left room ${result.code} (lobby)`);
      if (result.room) {
        io.to(result.code).emit('PLAYER_LEFT', {
          players: result.room.players,
          hostId: result.room.hostId,
        });
      }
    } else {
      // In-game disconnect — grace period started
      console.log(`[ROOM] Player ${result.playerId} disconnected from room ${result.code} (60s grace)`);
      io.to(result.code).emit('PLAYER_DISCONNECTED', {
        playerId: result.playerId,
        players: result.room.players,
      });
    }
  });
}
