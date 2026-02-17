// ─── In-Memory Game State Manager ───────────────────────────────
// Handles rooms, players, turns, properties, and economy.

const rooms = new Map();

const PLAYER_COLORS = [
  '#FF6B6B', '#4ECDC4', '#FFE66D', '#A78BFA',
  '#F97316', '#38BDF8', '#34D399', '#FB7185',
];

const STARTING_MONEY = 1500;
const GO_SALARY = 200;

// Property data: rent = ~10% of price for simplicity
const PROPERTY_DATA = {
  1:  { price: 60,  rent: 6 },
  3:  { price: 60,  rent: 6 },
  6:  { price: 100, rent: 10 },
  8:  { price: 100, rent: 10 },
  9:  { price: 120, rent: 12 },
  11: { price: 140, rent: 14 },
  13: { price: 140, rent: 14 },
  14: { price: 160, rent: 16 },
  16: { price: 180, rent: 18 },
  18: { price: 180, rent: 18 },
  19: { price: 200, rent: 20 },
  21: { price: 220, rent: 22 },
  23: { price: 220, rent: 22 },
  24: { price: 240, rent: 24 },
  26: { price: 260, rent: 26 },
  27: { price: 260, rent: 26 },
  29: { price: 280, rent: 28 },
  31: { price: 300, rent: 30 },
  32: { price: 300, rent: 30 },
  34: { price: 320, rent: 32 },
  37: { price: 350, rent: 35 },
  39: { price: 400, rent: 50 },
  // Railroads
  5:  { price: 200, rent: 25 },
  15: { price: 200, rent: 25 },
  25: { price: 200, rent: 25 },
  35: { price: 200, rent: 25 },
  // Utilities
  12: { price: 150, rent: 15 },
  28: { price: 150, rent: 15 },
};

// Tax spaces
const TAX_AMOUNTS = {
  4:  200, // Income Tax
  38: 200, // Super Tax
};

function generateCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 5; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export function createRoom(hostSocketId, hostName) {
  let code = generateCode();
  while (rooms.has(code)) code = generateCode();

  const room = {
    code,
    hostId: hostSocketId,
    players: [{
      id: hostSocketId,
      name: hostName,
      color: PLAYER_COLORS[0],
      position: 0,
      money: STARTING_MONEY,
    }],
    status: 'waiting',
    maxPlayers: 8,
    // Game state (populated on start)
    currentPlayerIndex: 0,
    properties: {},   // { spaceId: { ownerId, price, rent } }
    log: [],
  };

  rooms.set(code, room);
  return room;
}

export function joinRoom(code, socketId, playerName) {
  const room = rooms.get(code);
  if (!room) return { success: false, error: 'Room not found.' };
  if (room.status === 'playing') return { success: false, error: 'Game already started.' };
  if (room.players.length >= room.maxPlayers) return { success: false, error: 'Room is full.' };

  const colorIndex = room.players.length % PLAYER_COLORS.length;
  room.players.push({
    id: socketId,
    name: playerName,
    color: PLAYER_COLORS[colorIndex],
    position: 0,
    money: STARTING_MONEY,
  });

  return { success: true, room };
}

export function removePlayer(socketId) {
  for (const [code, room] of rooms) {
    const idx = room.players.findIndex((p) => p.id === socketId);
    if (idx === -1) continue;

    room.players.splice(idx, 1);

    if (room.players.length === 0) {
      rooms.delete(code);
      return { room: null, code };
    }

    if (room.hostId === socketId) {
      room.hostId = room.players[0].id;
    }

    // Fix currentPlayerIndex if needed
    if (room.status === 'playing') {
      if (room.currentPlayerIndex >= room.players.length) {
        room.currentPlayerIndex = 0;
      }
    }

    return { room, code };
  }
  return null;
}

export function getRoom(code) {
  return rooms.get(code) || null;
}

export function startGame(code) {
  const room = rooms.get(code);
  if (!room) return null;
  room.status = 'playing';
  room.currentPlayerIndex = 0;
  room.properties = {};
  room.log = [];
  // Reset all player positions and money
  room.players.forEach((p) => {
    p.position = 0;
    p.money = STARTING_MONEY;
  });
  return room;
}

/**
 * Roll dice for the current player. Returns the result object or null on error.
 */
export function rollDice(code, socketId) {
  const room = rooms.get(code);
  if (!room || room.status !== 'playing') return { error: 'No active game.' };

  const currentPlayer = room.players[room.currentPlayerIndex];
  if (currentPlayer.id !== socketId) return { error: 'Not your turn.' };

  const die1 = Math.floor(Math.random() * 6) + 1;
  const die2 = Math.floor(Math.random() * 6) + 1;
  const total = die1 + die2;

  const oldPosition = currentPlayer.position;
  const newPosition = (oldPosition + total) % 40;

  // Passed or landed on GO?
  const passedGo = newPosition < oldPosition;
  if (passedGo) {
    currentPlayer.money += GO_SALARY;
  }

  currentPlayer.position = newPosition;

  const result = {
    die1,
    die2,
    total,
    playerId: currentPlayer.id,
    playerName: currentPlayer.name,
    oldPosition,
    newPosition,
    passedGo,
    money: currentPlayer.money,
    // These will be filled in below
    landingAction: null,
  };

  // Determine what happens on landing
  const propData = PROPERTY_DATA[newPosition];
  const taxAmount = TAX_AMOUNTS[newPosition];

  if (taxAmount) {
    // Tax space
    currentPlayer.money -= taxAmount;
    result.landingAction = {
      type: 'tax',
      amount: taxAmount,
      money: currentPlayer.money,
    };
    room.log.push(`${currentPlayer.name} paid $${taxAmount} tax`);

  } else if (propData) {
    const owned = room.properties[newPosition];

    if (!owned) {
      // Unowned property — offer to buy
      result.landingAction = {
        type: 'buy_option',
        spaceId: newPosition,
        price: propData.price,
      };

    } else if (owned.ownerId === currentPlayer.id) {
      // Own property — nothing happens
      result.landingAction = { type: 'own_property' };

    } else {
      // Someone else owns it — pay rent
      const owner = room.players.find((p) => p.id === owned.ownerId);
      if (owner) {
        const rent = owned.rent;
        currentPlayer.money -= rent;
        owner.money += rent;
        result.landingAction = {
          type: 'rent',
          rent,
          ownerName: owner.name,
          ownerId: owner.id,
          payerMoney: currentPlayer.money,
          ownerMoney: owner.money,
        };
        room.log.push(`${currentPlayer.name} paid $${rent} rent to ${owner.name}`);
      }
    }
  } else if (newPosition === 30) {
    // Go To Jail — for now just a label, no jail mechanic in Phase 2
    result.landingAction = { type: 'go_to_jail' };
  }

  return result;
}

/**
 * Buy a property for the current player.
 */
export function buyProperty(code, socketId, spaceId) {
  const room = rooms.get(code);
  if (!room || room.status !== 'playing') return { error: 'No active game.' };

  const currentPlayer = room.players[room.currentPlayerIndex];
  if (currentPlayer.id !== socketId) return { error: 'Not your turn.' };

  const propData = PROPERTY_DATA[spaceId];
  if (!propData) return { error: 'Not a buyable space.' };
  if (room.properties[spaceId]) return { error: 'Already owned.' };
  if (currentPlayer.money < propData.price) return { error: 'Not enough money.' };

  currentPlayer.money -= propData.price;
  room.properties[spaceId] = {
    ownerId: currentPlayer.id,
    ownerName: currentPlayer.name,
    price: propData.price,
    rent: propData.rent,
  };

  room.log.push(`${currentPlayer.name} bought space ${spaceId} for $${propData.price}`);

  return {
    success: true,
    spaceId,
    ownerId: currentPlayer.id,
    ownerName: currentPlayer.name,
    price: propData.price,
    rent: propData.rent,
    money: currentPlayer.money,
  };
}

/**
 * End the current player's turn and advance to the next.
 */
export function endTurn(code, socketId) {
  const room = rooms.get(code);
  if (!room || room.status !== 'playing') return { error: 'No active game.' };

  const currentPlayer = room.players[room.currentPlayerIndex];
  if (currentPlayer.id !== socketId) return { error: 'Not your turn.' };

  room.currentPlayerIndex = (room.currentPlayerIndex + 1) % room.players.length;

  return {
    success: true,
    currentPlayerIndex: room.currentPlayerIndex,
    currentPlayerId: room.players[room.currentPlayerIndex].id,
    currentPlayerName: room.players[room.currentPlayerIndex].name,
  };
}

/**
 * Get serializable game state for broadcasting.
 */
export function getGameState(code) {
  const room = rooms.get(code);
  if (!room) return null;
  return {
    players: room.players.map((p) => ({
      id: p.id,
      name: p.name,
      color: p.color,
      position: p.position,
      money: p.money,
    })),
    currentPlayerIndex: room.currentPlayerIndex,
    currentPlayerId: room.players[room.currentPlayerIndex]?.id,
    properties: room.properties,
    status: room.status,
  };
}
