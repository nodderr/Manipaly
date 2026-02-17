// ─── Game Socket Event Handlers ─────────────────────────────────
import {
  rollDice, buyProperty, endTurn, getGameState, getRoom,
  payJailFine, rollForJail,
  buildHouse, mortgageProperty, unmortgageProperty,
  proposeTrade, respondTrade,
  startAuction, placeBid, endAuction,
} from './gameState.js';

const auctionTimers = new Map(); // code → timeout

export function registerGameHandlers(io, socket) {

  // ── Roll Dice ────────────────────────────────────────────────
  socket.on('ROLL_DICE', ({ code }) => {
    const result = rollDice(code, socket.id);
    if (result.error) { socket.emit('ERROR', { message: result.error }); return; }

    console.log(`[GAME] ${result.playerName} rolled ${result.die1}+${result.die2}=${result.total}`);
    io.to(code).emit('DICE_ROLLED', result);

    if (result.landingAction?.bankrupt) {
      io.to(code).emit('PLAYER_BANKRUPT', { playerId: result.playerId, playerName: result.playerName });
      if (result.winner) io.to(code).emit('GAME_OVER', result.winner);
    }

    broadcastState(io, code);
  });

  // ── Buy Property ─────────────────────────────────────────────
  socket.on('BUY_PROPERTY', ({ code, spaceId }) => {
    const result = buyProperty(code, socket.id, spaceId);
    if (result.error) { socket.emit('ERROR', { message: result.error }); return; }

    console.log(`[GAME] ${result.ownerName} bought space ${spaceId}`);
    io.to(code).emit('PROPERTY_BOUGHT', result);
    broadcastState(io, code);
  });

  // ── Pass on buying → Start Auction ───────────────────────────
  socket.on('PASS_PROPERTY', ({ code, spaceId }) => {
    socket.emit('PASS_ACKNOWLEDGED');

    if (spaceId) {
      const auctionResult = startAuction(code, spaceId);
      if (auctionResult.success) {
        console.log(`[GAME] Auction started for space ${spaceId}`);
        io.to(code).emit('AUCTION_STARTED', auctionResult.auction);

        // 10-second timer
        const timer = setTimeout(() => {
          const endResult = endAuction(code);
          auctionTimers.delete(code);
          io.to(code).emit('AUCTION_ENDED', endResult);
          broadcastState(io, code);
        }, 10000);
        auctionTimers.set(code, timer);
      }
    }
  });

  // ── Place Bid ────────────────────────────────────────────────
  socket.on('PLACE_BID', ({ code, amount }) => {
    const result = placeBid(code, socket.id, amount);
    if (result.error) { socket.emit('ERROR', { message: result.error }); return; }

    // Reset the 10-second timer on every new bid
    const existingTimer = auctionTimers.get(code);
    if (existingTimer) clearTimeout(existingTimer);
    const newTimer = setTimeout(() => {
      const endResult = endAuction(code);
      auctionTimers.delete(code);
      io.to(code).emit('AUCTION_ENDED', endResult);
      broadcastState(io, code);
    }, 10000);
    auctionTimers.set(code, newTimer);

    io.to(code).emit('AUCTION_BID', result);
  });

  // ── End Turn ─────────────────────────────────────────────────
  socket.on('END_TURN', ({ code }) => {
    const result = endTurn(code, socket.id);
    if (result.error) { socket.emit('ERROR', { message: result.error }); return; }

    console.log(`[GAME] Turn ended. Now: ${result.currentPlayerName}${result.inJail ? ' (in jail)' : ''}`);
    io.to(code).emit('TURN_CHANGED', result);
    broadcastState(io, code);
  });

  // ── Jail: Pay Fine ───────────────────────────────────────────
  socket.on('PAY_JAIL_FINE', ({ code }) => {
    const result = payJailFine(code, socket.id);
    if (result.error) { socket.emit('ERROR', { message: result.error }); return; }

    console.log(`[GAME] ${result.playerName} paid jail fine`);
    io.to(code).emit('JAIL_UPDATE', result);

    if (result.bankrupt) {
      io.to(code).emit('PLAYER_BANKRUPT', { playerId: result.playerId, playerName: result.playerName });
      if (result.winner) io.to(code).emit('GAME_OVER', result.winner);
    }

    broadcastState(io, code);
  });

  // ── Jail: Roll for Doubles ───────────────────────────────────
  socket.on('ROLL_FOR_JAIL', ({ code }) => {
    const result = rollForJail(code, socket.id);
    if (result.error) { socket.emit('ERROR', { message: result.error }); return; }

    console.log(`[GAME] ${result.playerName} rolled for jail: ${result.freed ? 'FREE' : 'STAY'}`);
    io.to(code).emit('JAIL_ROLL_RESULT', result);

    if (result.freed && result.landingAction?.bankrupt) {
      io.to(code).emit('PLAYER_BANKRUPT', { playerId: result.playerId, playerName: result.playerName });
      if (result.winner) io.to(code).emit('GAME_OVER', result.winner);
    }

    broadcastState(io, code);
  });

  // ── Build House ──────────────────────────────────────────────
  socket.on('BUILD_HOUSE', ({ code, spaceId }) => {
    const result = buildHouse(code, socket.id, spaceId);
    if (result.error) { socket.emit('ERROR', { message: result.error }); return; }

    console.log(`[GAME] ${result.playerName} built house on ${spaceId} (now ${result.houses})`);
    io.to(code).emit('HOUSE_BUILT', result);
    broadcastState(io, code);
  });

  // ── Mortgage Property ────────────────────────────────────────
  socket.on('MORTGAGE_PROPERTY', ({ code, spaceId }) => {
    const result = mortgageProperty(code, socket.id, spaceId);
    if (result.error) { socket.emit('ERROR', { message: result.error }); return; }

    console.log(`[GAME] ${result.playerName} mortgaged space ${spaceId}`);
    io.to(code).emit('PROPERTY_MORTGAGED', result);
    broadcastState(io, code);
  });

  // ── Unmortgage Property ──────────────────────────────────────
  socket.on('UNMORTGAGE_PROPERTY', ({ code, spaceId }) => {
    const result = unmortgageProperty(code, socket.id, spaceId);
    if (result.error) { socket.emit('ERROR', { message: result.error }); return; }

    console.log(`[GAME] ${result.playerName} unmortgaged space ${spaceId}`);
    io.to(code).emit('PROPERTY_UNMORTGAGED', result);
    broadcastState(io, code);
  });

  // ── Propose Trade ────────────────────────────────────────────
  socket.on('PROPOSE_TRADE', ({ code, targetId, offerProps, offerMoney, wantProps, wantMoney }) => {
    const result = proposeTrade(code, socket.id, { targetId, offerProps, offerMoney, wantProps, wantMoney });
    if (result.error) { socket.emit('ERROR', { message: result.error }); return; }

    console.log(`[GAME] Trade proposed: ${result.trade.fromName} → ${result.trade.toName}`);
    io.to(code).emit('TRADE_PROPOSED', result.trade);
  });

  // ── Respond to Trade ─────────────────────────────────────────
  socket.on('RESPOND_TRADE', ({ code, accept }) => {
    const result = respondTrade(code, socket.id, accept);
    if (result.error) { socket.emit('ERROR', { message: result.error }); return; }

    console.log(`[GAME] Trade ${result.accepted ? 'accepted' : 'rejected'}`);
    io.to(code).emit('TRADE_RESOLVED', result);
    broadcastState(io, code);
  });

  // ── Request full game state ──────────────────────────────────
  socket.on('REQUEST_GAME_STATE', ({ code }) => {
    const state = getGameState(code);
    if (state) socket.emit('GAME_STATE_UPDATE', state);
  });
}

function broadcastState(io, code) {
  const state = getGameState(code);
  if (state) io.to(code).emit('GAME_STATE_UPDATE', state);
}
