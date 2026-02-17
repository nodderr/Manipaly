// ─── Lobby Socket Event Handlers ────────────────────────────────
import { createRoom, joinRoom, removePlayer, getRoom, startGame, getGameState } from './gameState.js';

export function registerLobbyHandlers(io, socket) {
  socket.on('CREATE_ROOM', ({ name }) => {
    if (!name || name.trim().length === 0) {
      socket.emit('ERROR', { message: 'Display name is required.' });
      return;
    }
    const room = createRoom(socket.id, name.trim());
    socket.join(room.code);
    console.log(`[ROOM] ${name} created room ${room.code}`);
    socket.emit('ROOM_CREATED', {
      code: room.code,
      players: room.players,
      hostId: room.hostId,
    });
  });

  socket.on('JOIN_ROOM', ({ code, name }) => {
    if (!name || name.trim().length === 0) {
      socket.emit('ERROR', { message: 'Display name is required.' });
      return;
    }
    if (!code || code.trim().length === 0) {
      socket.emit('ERROR', { message: 'Room code is required.' });
      return;
    }
    const result = joinRoom(code.toUpperCase(), socket.id, name.trim());
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
    if (room.hostId !== socket.id) { socket.emit('ERROR', { message: 'Only the host can start.' }); return; }
    if (room.players.length < 2) { socket.emit('ERROR', { message: 'Need 2+ players.' }); return; }

    const startedRoom = startGame(code);
    console.log(`[GAME] Room ${code} started with ${startedRoom.players.length} players`);

    const state = getGameState(code);
    io.to(code).emit('GAME_START', state);
  });

  socket.on('disconnect', () => {
    const result = removePlayer(socket.id);
    if (!result) return;
    console.log(`[ROOM] Player disconnected from room ${result.code}`);
    if (result.room) {
      io.to(result.code).emit('PLAYER_LEFT', {
        players: result.room.players,
        hostId: result.room.hostId,
      });
    }
  });
}
