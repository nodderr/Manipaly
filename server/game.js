// ─── Game Socket Event Handlers ─────────────────────────────────
import { rollDice, buyProperty, endTurn, getGameState, getRoom } from './gameState.js';

export function registerGameHandlers(io, socket) {

  // ── Roll Dice ────────────────────────────────────────────────
  socket.on('ROLL_DICE', ({ code }) => {
    const result = rollDice(code, socket.id);

    if (result.error) {
      socket.emit('ERROR', { message: result.error });
      return;
    }

    console.log(`[GAME] ${result.playerName} rolled ${result.die1}+${result.die2}=${result.total}, moved to ${result.newPosition}`);

    // Broadcast dice result + movement to all players
    io.to(code).emit('DICE_ROLLED', result);

    // Broadcast updated game state
    const state = getGameState(code);
    if (state) {
      io.to(code).emit('GAME_STATE_UPDATE', state);
    }
  });

  // ── Buy Property ─────────────────────────────────────────────
  socket.on('BUY_PROPERTY', ({ code, spaceId }) => {
    const result = buyProperty(code, socket.id, spaceId);

    if (result.error) {
      socket.emit('ERROR', { message: result.error });
      return;
    }

    console.log(`[GAME] ${result.ownerName} bought space ${spaceId} for $${result.price}`);

    io.to(code).emit('PROPERTY_BOUGHT', result);

    // Broadcast updated game state
    const state = getGameState(code);
    if (state) {
      io.to(code).emit('GAME_STATE_UPDATE', state);
    }
  });

  // ── Pass on buying (just end the buy option) ─────────────────
  socket.on('PASS_PROPERTY', ({ code }) => {
    // Nothing to do server-side, just acknowledge
    socket.emit('PASS_ACKNOWLEDGED');
  });

  // ── End Turn ─────────────────────────────────────────────────
  socket.on('END_TURN', ({ code }) => {
    const result = endTurn(code, socket.id);

    if (result.error) {
      socket.emit('ERROR', { message: result.error });
      return;
    }

    console.log(`[GAME] Turn ended. Now: ${result.currentPlayerName}`);

    io.to(code).emit('TURN_CHANGED', result);

    // Broadcast updated game state
    const state = getGameState(code);
    if (state) {
      io.to(code).emit('GAME_STATE_UPDATE', state);
    }
  });

  // ── Request full game state (for sync) ───────────────────────
  socket.on('REQUEST_GAME_STATE', ({ code }) => {
    const state = getGameState(code);
    if (state) {
      socket.emit('GAME_STATE_UPDATE', state);
    }
  });
}
