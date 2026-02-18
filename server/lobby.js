// ─── Lobby Socket Event Handlers ────────────────────────────────
import {
  createRoom, joinRoom, disconnectPlayer, reconnectPlayer,
  getRoom, startGame, getGameState, getPlayerIdFromSocket,
  exportGamePGN, decodePGN, createRoomFromPGN, joinPGNRoom,
  leaveRoom,
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

    const upperCode = code.toUpperCase();
    const result = joinRoom(upperCode, playerId, socket.id, name.trim());

    // If this is a PGN room, route through PGN join logic
    if (!result.success && result.error === 'pgn_room') {
      const pgnResult = joinPGNRoom(upperCode, playerId, socket.id, name.trim());
      if (!pgnResult.success) {
        socket.emit('ERROR', { message: pgnResult.error });
        return;
      }
      socket.join(pgnResult.room.code);
      console.log(`[PGN] ${name} joined PGN room ${pgnResult.room.code}`);

      // Notify all players about updated slots
      io.to(pgnResult.room.code).emit('PGN_PLAYER_JOINED', {
        players: pgnResult.room.players,
        hostId: pgnResult.room.hostId,
        pgnSlots: pgnResult.pgnSlots,
      });

      // If all players joined, auto-start the restored game
      if (pgnResult.allJoined) {
        console.log(`[PGN] All players joined room ${pgnResult.room.code} — game restored!`);
        const state = getGameState(upperCode);
        io.to(pgnResult.room.code).emit('GAME_START', state);
      }
      return;
    }

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

  // ── Export PGN ──────────────────────────────────────────────────
  socket.on('EXPORT_PGN', ({ code }) => {
    if (!code) { socket.emit('ERROR', { message: 'Room code is required.' }); return; }
    const result = exportGamePGN(code);
    if (result.error) { socket.emit('ERROR', { message: result.error }); return; }
    console.log(`[PGN] Game exported for room ${code}`);
    socket.emit('PGN_EXPORTED', { pgn: result.pgn });
  });

  // ── Load PGN ───────────────────────────────────────────────────
  socket.on('LOAD_PGN', ({ pgn, name, playerId }) => {
    if (!pgn || !name || !playerId) {
      socket.emit('ERROR', { message: 'PGN string, name, and player ID are required.' });
      return;
    }
    const decoded = decodePGN(pgn);
    if (decoded.error) {
      socket.emit('ERROR', { message: decoded.error });
      return;
    }
    const result = createRoomFromPGN(decoded.data, playerId, socket.id, name.trim());
    if (!result.success) {
      socket.emit('ERROR', { message: result.error });
      return;
    }
    socket.join(result.room.code);
    console.log(`[PGN] ${name} created PGN room ${result.room.code} (${decoded.data.players.length} players expected)`);
    socket.emit('PGN_ROOM_CREATED', {
      code: result.room.code,
      players: result.room.players,
      hostId: result.room.hostId,
      pgnSlots: result.pgnSlots,
    });
  });

  // ── Leave Room (explicit) ────────────────────────────────────
  socket.on('LEAVE_ROOM', ({ code }) => {
    if (!code) return;
    const upperCode = code.toUpperCase();

    const result = leaveRoom(upperCode, socket.id);
    if (!result) return;

    socket.leave(upperCode);
    console.log(`[ROOM] ${result.playerName} left room ${upperCode}`);

    if (!result.room) {
      // Room was deleted (no players left)
      return;
    }

    if (result.room.pgnSlots) {
      io.to(upperCode).emit('PGN_PLAYER_JOINED', {
        players: result.room.players,
        hostId: result.room.hostId,
        pgnSlots: result.room.pgnSlots,
      });
    } else {
      io.to(upperCode).emit('PLAYER_LEFT', {
        players: result.room.players,
        hostId: result.room.hostId,
      });
    }
  });

  socket.on('disconnect', () => {
    const result = disconnectPlayer(socket.id);
    if (!result) return;

    if (result.permanent) {
      // Lobby disconnect — removed immediately
      console.log(`[ROOM] Player left room ${result.code} (lobby)`);
      if (result.room) {
        // If PGN room, update slots to un-join the player
        if (result.room.pgnSlots) {
          const slot = result.room.pgnSlots.find((s) => s.playerId === result.playerId);
          if (slot) {
            slot.joined = false;
            slot.playerId = null;
          }
          io.to(result.code).emit('PGN_PLAYER_JOINED', {
            players: result.room.players,
            hostId: result.room.hostId,
            pgnSlots: result.room.pgnSlots,
          });
        } else {
          io.to(result.code).emit('PLAYER_LEFT', {
            players: result.room.players,
            hostId: result.room.hostId,
          });
        }
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
