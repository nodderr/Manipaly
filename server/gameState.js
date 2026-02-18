// ─── In-Memory Game State Manager ───────────────────────────────
// Handles rooms, players, turns, properties, houses, jail, mortgage,
// trading, auctions, and bankruptcy/win conditions.

const rooms = new Map();

const PLAYER_COLORS = [
  '#FF6B6B', '#4ECDC4', '#FFE66D', '#A78BFA',
  '#F97316', '#38BDF8', '#34D399', '#FB7185',
];

const STARTING_MONEY = 1500;
const GO_SALARY = 200;
const JAIL_FINE = 50;
const MAX_JAIL_TURNS = 3;
const AUCTION_DURATION_MS = 10000;

// ── Property data with rent tiers ────────────────────────────────
const PROPERTY_DATA = {
  // Brown
  1:  { price: 60,  rent: [2, 10, 30, 90, 160, 250],     houseCost: 50,  mortgage: 30,  group: 'brown' },
  3:  { price: 60,  rent: [4, 20, 60, 180, 320, 450],    houseCost: 50,  mortgage: 30,  group: 'brown' },
  // Light Blue
  6:  { price: 100, rent: [6, 30, 90, 270, 400, 550],    houseCost: 50,  mortgage: 50,  group: 'lightblue' },
  8:  { price: 100, rent: [6, 30, 90, 270, 400, 550],    houseCost: 50,  mortgage: 50,  group: 'lightblue' },
  9:  { price: 120, rent: [8, 40, 100, 300, 450, 600],   houseCost: 50,  mortgage: 60,  group: 'lightblue' },
  // Pink
  11: { price: 140, rent: [10, 50, 150, 450, 625, 750],  houseCost: 100, mortgage: 70,  group: 'pink' },
  13: { price: 140, rent: [10, 50, 150, 450, 625, 750],  houseCost: 100, mortgage: 70,  group: 'pink' },
  14: { price: 160, rent: [12, 60, 180, 500, 700, 900],  houseCost: 100, mortgage: 80,  group: 'pink' },
  // Orange
  16: { price: 180, rent: [14, 70, 200, 550, 750, 950],  houseCost: 100, mortgage: 90,  group: 'orange' },
  18: { price: 180, rent: [14, 70, 200, 550, 750, 950],  houseCost: 100, mortgage: 90,  group: 'orange' },
  19: { price: 200, rent: [16, 80, 220, 600, 800, 1000], houseCost: 100, mortgage: 100, group: 'orange' },
  // Red
  21: { price: 220, rent: [18, 90, 250, 700, 875, 1050], houseCost: 150, mortgage: 110, group: 'red' },
  23: { price: 220, rent: [18, 90, 250, 700, 875, 1050], houseCost: 150, mortgage: 110, group: 'red' },
  24: { price: 240, rent: [20, 100, 300, 750, 925, 1100],houseCost: 150, mortgage: 120, group: 'red' },
  // Yellow
  26: { price: 260, rent: [22, 110, 330, 800, 975, 1150],houseCost: 150, mortgage: 130, group: 'yellow' },
  27: { price: 260, rent: [22, 110, 330, 800, 975, 1150],houseCost: 150, mortgage: 130, group: 'yellow' },
  29: { price: 280, rent: [24, 120, 360, 850, 1025, 1200],houseCost: 150, mortgage: 140, group: 'yellow' },
  // Green
  31: { price: 300, rent: [26, 130, 390, 900, 1100, 1275],houseCost: 200, mortgage: 150, group: 'green' },
  32: { price: 300, rent: [26, 130, 390, 900, 1100, 1275],houseCost: 200, mortgage: 150, group: 'green' },
  34: { price: 320, rent: [28, 150, 450, 1000, 1200, 1400],houseCost: 200, mortgage: 160, group: 'green' },
  // Dark Blue
  37: { price: 350, rent: [35, 175, 500, 1100, 1300, 1500],houseCost: 200, mortgage: 175, group: 'darkblue' },
  39: { price: 400, rent: [50, 200, 600, 1400, 1700, 2000],houseCost: 200, mortgage: 200, group: 'darkblue' },
  // Railroads
  5:  { price: 200, rent: [25, 50, 100, 200], mortgage: 100, group: 'railroad', isRailroad: true },
  15: { price: 200, rent: [25, 50, 100, 200], mortgage: 100, group: 'railroad', isRailroad: true },
  25: { price: 200, rent: [25, 50, 100, 200], mortgage: 100, group: 'railroad', isRailroad: true },
  35: { price: 200, rent: [25, 50, 100, 200], mortgage: 100, group: 'railroad', isRailroad: true },
  // Utilities
  12: { price: 150, rent: [4, 10], mortgage: 75, group: 'utility', isUtility: true },
  28: { price: 150, rent: [4, 10], mortgage: 75, group: 'utility', isUtility: true },
};

// Tax spaces
const TAX_AMOUNTS = { 4: 200, 38: 200 };

// Chance / Community Chest spaces
const CHANCE_SPACES = [7, 22, 36];
const CHEST_SPACES  = [2, 17, 33];

// ── Card Decks ───────────────────────────────────────────────────
const CHANCE_CARDS = [
  { id: 'ch1',  text: 'Advance to GO. Collect $200.',                     action: 'move', destination: 0 },
  { id: 'ch2',  text: 'Advance to Trafalgar Square.',                     action: 'move', destination: 24 },
  { id: 'ch3',  text: 'Advance to Pall Mall.',                            action: 'move', destination: 11 },
  { id: 'ch4',  text: 'Advance to Mayfair.',                              action: 'move', destination: 39 },
  { id: 'ch5',  text: "Advance to King's Cross Station.",                  action: 'move', destination: 5 },
  { id: 'ch6',  text: 'Go to Jail. Go directly to Jail.',                 action: 'go_to_jail' },
  { id: 'ch7',  text: 'Go back 3 spaces.',                                action: 'move_back', spaces: 3 },
  { id: 'ch8',  text: 'Bank pays you dividend of $50.',                   action: 'collect', amount: 50 },
  { id: 'ch9',  text: 'Your building loan matures. Collect $150.',        action: 'collect', amount: 150 },
  { id: 'ch10', text: 'You have won a crossword competition. Collect $100.', action: 'collect', amount: 100 },
  { id: 'ch11', text: 'Speeding fine. Pay $15.',                          action: 'pay', amount: 15 },
  { id: 'ch12', text: 'Pay school fees of $150.',                         action: 'pay', amount: 150 },
  { id: 'ch13', text: 'Drunk in charge. Fine $20.',                       action: 'pay', amount: 20 },
  { id: 'ch14', text: 'Make general repairs: $25 per house, $100 per hotel.', action: 'repairs', perHouse: 25, perHotel: 100 },
  { id: 'ch15', text: 'You are assessed for street repairs: $40 per house, $115 per hotel.', action: 'repairs', perHouse: 40, perHotel: 115 },
  { id: 'ch16', text: 'Get out of Jail free.',                            action: 'get_out_of_jail' },
];

const CHEST_CARDS = [
  { id: 'cc1',  text: 'Advance to GO. Collect $200.',                     action: 'move', destination: 0 },
  { id: 'cc2',  text: 'Bank error in your favour. Collect $200.',         action: 'collect', amount: 200 },
  { id: 'cc3',  text: "Doctor's fee. Pay $50.",                           action: 'pay', amount: 50 },
  { id: 'cc4',  text: 'From sale of stock you get $50.',                  action: 'collect', amount: 50 },
  { id: 'cc5',  text: 'Get out of Jail free.',                            action: 'get_out_of_jail' },
  { id: 'cc6',  text: 'Go to Jail. Go directly to Jail.',                 action: 'go_to_jail' },
  { id: 'cc7',  text: 'Grand Opera Night. Collect $50 from every player.', action: 'collect_from_all', amount: 50 },
  { id: 'cc8',  text: 'Holiday Fund matures. Collect $100.',              action: 'collect', amount: 100 },
  { id: 'cc9',  text: 'Income tax refund. Collect $20.',                  action: 'collect', amount: 20 },
  { id: 'cc10', text: "It's your birthday. Collect $10 from every player.", action: 'collect_from_all', amount: 10 },
  { id: 'cc11', text: 'Life insurance matures. Collect $100.',            action: 'collect', amount: 100 },
  { id: 'cc12', text: 'Hospital fees. Pay $100.',                         action: 'pay', amount: 100 },
  { id: 'cc13', text: 'School fees. Pay $50.',                            action: 'pay', amount: 50 },
  { id: 'cc14', text: 'Receive $25 consultancy fee.',                     action: 'collect', amount: 25 },
  { id: 'cc15', text: 'You have won second prize in a beauty contest. Collect $10.', action: 'collect', amount: 10 },
  { id: 'cc16', text: 'You inherit $100.',                                action: 'collect', amount: 100 },
];

function shuffleCards(cards) {
  const arr = [...cards];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function drawCard(room, deckType) {
  const deck = deckType === 'chance' ? room.chanceDeck : room.chestDeck;
  if (deck.length === 0) {
    // Re-shuffle
    const source = deckType === 'chance' ? CHANCE_CARDS : CHEST_CARDS;
    deck.push(...shuffleCards(source));
  }
  return deck.shift();
}

// Group membership lookup
const GROUP_SPACES = {};
for (const [id, data] of Object.entries(PROPERTY_DATA)) {
  if (!GROUP_SPACES[data.group]) GROUP_SPACES[data.group] = [];
  GROUP_SPACES[data.group].push(Number(id));
}

function generateCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 5; i++) code += chars.charAt(Math.floor(Math.random() * chars.length));
  return code;
}

// ═══════════════════════════════════════════════════════════════════
// ROOM MANAGEMENT
// ═══════════════════════════════════════════════════════════════════

export function createRoom(hostSocketId, hostName) {
  let code = generateCode();
  while (rooms.has(code)) code = generateCode();

  const room = {
    code,
    hostId: hostSocketId,
    players: [{
      id: hostSocketId, name: hostName, color: PLAYER_COLORS[0],
      position: 0, money: STARTING_MONEY,
      inJail: false, jailTurns: 0, bankrupt: false,
    }],
    status: 'waiting',
    maxPlayers: 8,
    currentPlayerIndex: 0,
    properties: {},     // { spaceId: { ownerId, ownerName, price, rent, houses, mortgaged } }
    pendingTrade: null,  // { id, fromId, toId, offerProps, offerMoney, wantProps, wantMoney }
    auction: null,       // { spaceId, bids: {playerId: amount}, highBid, highBidder, timer }
    winner: null,
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
    id: socketId, name: playerName, color: PLAYER_COLORS[colorIndex],
    position: 0, money: STARTING_MONEY,
    inJail: false, jailTurns: 0, bankrupt: false,
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

    if (room.hostId === socketId) room.hostId = room.players[0].id;

    if (room.status === 'playing') {
      if (room.currentPlayerIndex >= room.players.length) room.currentPlayerIndex = 0;
      checkWinCondition(room);
    }

    return { room, code };
  }
  return null;
}

export function getRoom(code) { return rooms.get(code) || null; }

export function startGame(code) {
  const room = rooms.get(code);
  if (!room) return null;
  room.status = 'playing';
  room.currentPlayerIndex = 0;
  room.properties = {};
  room.pendingTrade = null;
  room.auction = null;
  room.winner = null;
  room.log = [];
  room.chanceDeck = shuffleCards(CHANCE_CARDS);
  room.chestDeck  = shuffleCards(CHEST_CARDS);
  room.jailFreeCards = {};  // { playerId: ['chance'|'chest', ...] }
  room.players.forEach((p) => {
    p.position = 0;
    p.money = STARTING_MONEY;
    p.inJail = false;
    p.jailTurns = 0;
    p.bankrupt = false;
  });
  return room;
}

// ═══════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════

function getActivePlayers(room) {
  return room.players.filter((p) => !p.bankrupt);
}

function getCurrentPlayer(room) {
  return room.players[room.currentPlayerIndex];
}

function checkWinCondition(room) {
  const active = getActivePlayers(room);
  if (active.length === 1 && room.players.length > 1) {
    room.winner = active[0].id;
    return active[0];
  }
  return null;
}

function advanceTurn(room) {
  const active = getActivePlayers(room);
  if (active.length <= 1) return;

  let next = (room.currentPlayerIndex + 1) % room.players.length;
  while (room.players[next].bankrupt) {
    next = (next + 1) % room.players.length;
  }
  room.currentPlayerIndex = next;
}

function getPlayerOwnedInGroup(room, playerId, group) {
  return Object.entries(room.properties)
    .filter(([, prop]) => prop.ownerId === playerId && PROPERTY_DATA[Number(Object.keys(room.properties).find((k) => room.properties[k] === prop))]?.group === group)
    .map(([id]) => Number(id));
}

function ownsFullGroup(room, playerId, group) {
  const groupSpaces = GROUP_SPACES[group];
  if (!groupSpaces) return false;
  return groupSpaces.every((id) => room.properties[id]?.ownerId === playerId);
}

function calculateRent(room, spaceId, diceTotal) {
  const prop = room.properties[spaceId];
  const data = PROPERTY_DATA[spaceId];
  if (!prop || !data || prop.mortgaged) return 0;

  if (data.isRailroad) {
    // Count railroads owned by this player
    const rrCount = [5, 15, 25, 35].filter((id) => room.properties[id]?.ownerId === prop.ownerId && !room.properties[id]?.mortgaged).length;
    return data.rent[Math.min(rrCount - 1, 3)];
  }

  if (data.isUtility) {
    // Count utilities owned by this player
    const utilCount = [12, 28].filter((id) => room.properties[id]?.ownerId === prop.ownerId && !room.properties[id]?.mortgaged).length;
    return data.rent[Math.min(utilCount - 1, 1)] * diceTotal;
  }

  // Regular property — rent based on houses
  const houses = prop.houses || 0;
  return data.rent[Math.min(houses, 5)];
}

function goBankrupt(room, player) {
  player.bankrupt = true;
  player.money = 0;
  // Return all properties to bank
  for (const [spaceId, prop] of Object.entries(room.properties)) {
    if (prop.ownerId === player.id) {
      delete room.properties[spaceId];
    }
  }
  room.log.push(`${player.name} went bankrupt!`);
}

// ═══════════════════════════════════════════════════════════════════
// DICE ROLL
// ═══════════════════════════════════════════════════════════════════

export function rollDice(code, socketId) {
  const room = rooms.get(code);
  if (!room || room.status !== 'playing') return { error: 'No active game.' };
  if (room.winner) return { error: 'Game is over.' };

  const currentPlayer = getCurrentPlayer(room);
  if (currentPlayer.id !== socketId) return { error: 'Not your turn.' };
  if (currentPlayer.inJail) return { error: 'You are in jail! Pay fine or try rolling doubles.' };

  const die1 = Math.floor(Math.random() * 6) + 1;
  const die2 = Math.floor(Math.random() * 6) + 1;
  const total = die1 + die2;

  const oldPosition = currentPlayer.position;
  const newPosition = (oldPosition + total) % 40;

  const passedGo = newPosition < oldPosition && newPosition !== 10; // Don't give GO money if going to jail
  if (passedGo) currentPlayer.money += GO_SALARY;

  currentPlayer.position = newPosition;

  const result = {
    die1, die2, total,
    playerId: currentPlayer.id, playerName: currentPlayer.name,
    oldPosition, newPosition, passedGo,
    money: currentPlayer.money,
    landingAction: null,
  };

  // ── Go to Jail ──────────────────────────────────────────────
  if (newPosition === 30) {
    currentPlayer.position = 10;
    currentPlayer.inJail = true;
    currentPlayer.jailTurns = 0;
    result.newPosition = 10;
    result.landingAction = { type: 'go_to_jail' };
    room.log.push(`${currentPlayer.name} was sent to jail!`);
    return result;
  }

  // ── Tax ─────────────────────────────────────────────────────
  const taxAmount = TAX_AMOUNTS[newPosition];
  if (taxAmount) {
    currentPlayer.money -= taxAmount;
    result.money = currentPlayer.money;
    result.landingAction = { type: 'tax', amount: taxAmount, money: currentPlayer.money };
    room.log.push(`${currentPlayer.name} paid $${taxAmount} tax`);

    if (currentPlayer.money < 0) {
      goBankrupt(room, currentPlayer);
      result.landingAction.bankrupt = true;
      const winner = checkWinCondition(room);
      if (winner) result.winner = { id: winner.id, name: winner.name };
    }
    return result;
  }

  // ── Chance / Community Chest ─────────────────────────────────
  const isChance = CHANCE_SPACES.includes(newPosition);
  const isChest  = CHEST_SPACES.includes(newPosition);
  if (isChance || isChest) {
    const deckType = isChance ? 'chance' : 'chest';
    const card = drawCard(room, deckType);
    result.landingAction = { type: 'card', deckType, card: { id: card.id, text: card.text } };
    room.log.push(`${currentPlayer.name} drew: "${card.text}"`);

    switch (card.action) {
      case 'move': {
        const dest = card.destination;
        if (dest < currentPlayer.position && dest !== 10) {
          currentPlayer.money += GO_SALARY; // passed GO
          result.landingAction.passedGo = true;
        }
        currentPlayer.position = dest;
        result.landingAction.newPosition = dest;
        result.money = currentPlayer.money;

        // Re-evaluate the destination space for rent/buy
        const destProp = PROPERTY_DATA[dest];
        if (destProp) {
          const owned = room.properties[dest];
          if (!owned) {
            result.landingAction.buyOption = { spaceId: dest, price: destProp.price };
          } else if (owned.ownerId !== currentPlayer.id && !owned.mortgaged) {
            const rent = calculateRent(room, dest, total);
            const owner = room.players.find((p) => p.id === owned.ownerId);
            if (owner && !owner.bankrupt && rent > 0) {
              currentPlayer.money -= rent;
              owner.money += rent;
              result.money = currentPlayer.money;
              result.landingAction.rent = rent;
              result.landingAction.ownerName = owner.name;
              room.log.push(`${currentPlayer.name} paid $${rent} rent to ${owner.name}`);
              if (currentPlayer.money < 0) {
                goBankrupt(room, currentPlayer);
                result.landingAction.bankrupt = true;
                const winner = checkWinCondition(room);
                if (winner) result.winner = { id: winner.id, name: winner.name };
              }
            }
          }
        }
        break;
      }
      case 'move_back': {
        const dest = (currentPlayer.position - card.spaces + 40) % 40;
        currentPlayer.position = dest;
        result.landingAction.newPosition = dest;
        break;
      }
      case 'go_to_jail':
        currentPlayer.position = 10;
        currentPlayer.inJail = true;
        currentPlayer.jailTurns = 0;
        result.landingAction.newPosition = 10;
        room.log.push(`${currentPlayer.name} was sent to jail!`);
        break;
      case 'collect':
        currentPlayer.money += card.amount;
        result.money = currentPlayer.money;
        result.landingAction.moneyDelta = card.amount;
        break;
      case 'pay':
        currentPlayer.money -= card.amount;
        result.money = currentPlayer.money;
        result.landingAction.moneyDelta = -card.amount;
        if (currentPlayer.money < 0) {
          goBankrupt(room, currentPlayer);
          result.landingAction.bankrupt = true;
          const winner = checkWinCondition(room);
          if (winner) result.winner = { id: winner.id, name: winner.name };
        }
        break;
      case 'collect_from_all': {
        const others = getActivePlayers(room).filter((p) => p.id !== currentPlayer.id);
        let totalCollected = 0;
        others.forEach((p) => {
          const amt = Math.min(card.amount, p.money);
          p.money -= amt;
          totalCollected += amt;
        });
        currentPlayer.money += totalCollected;
        result.money = currentPlayer.money;
        result.landingAction.moneyDelta = totalCollected;
        break;
      }
      case 'repairs': {
        let cost = 0;
        for (const [, prop] of Object.entries(room.properties)) {
          if (prop.ownerId === currentPlayer.id) {
            const h = prop.houses || 0;
            if (h === 5) cost += card.perHotel;
            else cost += h * card.perHouse;
          }
        }
        currentPlayer.money -= cost;
        result.money = currentPlayer.money;
        result.landingAction.moneyDelta = -cost;
        room.log.push(`${currentPlayer.name} paid $${cost} for repairs`);
        if (currentPlayer.money < 0) {
          goBankrupt(room, currentPlayer);
          result.landingAction.bankrupt = true;
          const winner = checkWinCondition(room);
          if (winner) result.winner = { id: winner.id, name: winner.name };
        }
        break;
      }
      case 'get_out_of_jail':
        if (!room.jailFreeCards[currentPlayer.id]) room.jailFreeCards[currentPlayer.id] = [];
        room.jailFreeCards[currentPlayer.id].push(deckType);
        result.landingAction.jailFreeCard = true;
        break;
    }
    return result;
  }
  const propData = PROPERTY_DATA[newPosition];
  if (propData) {
    const owned = room.properties[newPosition];

    if (!owned) {
      // Unowned — offer to buy
      result.landingAction = { type: 'buy_option', spaceId: newPosition, price: propData.price };
    } else if (owned.ownerId === currentPlayer.id) {
      result.landingAction = { type: 'own_property' };
    } else if (!owned.mortgaged) {
      // Pay rent
      const rent = calculateRent(room, newPosition, total);
      const owner = room.players.find((p) => p.id === owned.ownerId);
      if (owner && !owner.bankrupt && rent > 0) {
        currentPlayer.money -= rent;
        owner.money += rent;
        result.money = currentPlayer.money;
        result.landingAction = {
          type: 'rent', rent,
          ownerName: owner.name, ownerId: owner.id,
          payerMoney: currentPlayer.money, ownerMoney: owner.money,
        };
        room.log.push(`${currentPlayer.name} paid $${rent} rent to ${owner.name}`);

        if (currentPlayer.money < 0) {
          goBankrupt(room, currentPlayer);
          result.landingAction.bankrupt = true;
          const winner = checkWinCondition(room);
          if (winner) result.winner = { id: winner.id, name: winner.name };
        }
      }
    } else {
      // Mortgaged property — no rent
      result.landingAction = { type: 'mortgaged_property' };
    }
  }

  return result;
}

// ═══════════════════════════════════════════════════════════════════
// JAIL
// ═══════════════════════════════════════════════════════════════════

export function payJailFine(code, socketId) {
  const room = rooms.get(code);
  if (!room || room.status !== 'playing') return { error: 'No active game.' };

  const player = getCurrentPlayer(room);
  if (player.id !== socketId) return { error: 'Not your turn.' };
  if (!player.inJail) return { error: 'Not in jail.' };

  player.money -= JAIL_FINE;
  player.inJail = false;
  player.jailTurns = 0;

  room.log.push(`${player.name} paid $${JAIL_FINE} to get out of jail`);

  if (player.money < 0) {
    goBankrupt(room, player);
    const winner = checkWinCondition(room);
    return {
      success: true, freed: true, bankrupt: true, money: player.money,
      playerId: player.id, playerName: player.name,
      winner: winner ? { id: winner.id, name: winner.name } : null,
    };
  }

  return {
    success: true, freed: true, bankrupt: false,
    money: player.money, playerId: player.id, playerName: player.name,
  };
}

export function rollForJail(code, socketId) {
  const room = rooms.get(code);
  if (!room || room.status !== 'playing') return { error: 'No active game.' };

  const player = getCurrentPlayer(room);
  if (player.id !== socketId) return { error: 'Not your turn.' };
  if (!player.inJail) return { error: 'Not in jail.' };

  const die1 = Math.floor(Math.random() * 6) + 1;
  const die2 = Math.floor(Math.random() * 6) + 1;
  player.jailTurns++;

  if (die1 === die2) {
    // Doubles! Free!
    player.inJail = false;
    player.jailTurns = 0;
    const total = die1 + die2;
    const oldPosition = player.position;
    const newPosition = (oldPosition + total) % 40;
    const passedGo = newPosition < oldPosition;
    if (passedGo) player.money += GO_SALARY;
    player.position = newPosition;

    room.log.push(`${player.name} rolled doubles and escaped jail!`);

    // Process landing (reuse rollDice logic inline)
    const result = {
      success: true, freed: true, die1, die2, total,
      playerId: player.id, playerName: player.name,
      oldPosition, newPosition, passedGo, money: player.money,
      landingAction: null,
    };

    // Check landing actions
    if (newPosition === 30) {
      player.position = 10;
      player.inJail = true;
      result.newPosition = 10;
      result.landingAction = { type: 'go_to_jail' };
    } else {
      const taxAmount = TAX_AMOUNTS[newPosition];
      if (taxAmount) {
        player.money -= taxAmount;
        result.money = player.money;
        result.landingAction = { type: 'tax', amount: taxAmount };
        if (player.money < 0) {
          goBankrupt(room, player);
          result.landingAction.bankrupt = true;
          const w = checkWinCondition(room);
          if (w) result.winner = { id: w.id, name: w.name };
        }
      } else {
        const propData = PROPERTY_DATA[newPosition];
        if (propData) {
          const owned = room.properties[newPosition];
          if (!owned) {
            result.landingAction = { type: 'buy_option', spaceId: newPosition, price: propData.price };
          } else if (owned.ownerId === player.id) {
            result.landingAction = { type: 'own_property' };
          } else if (!owned.mortgaged) {
            const rent = calculateRent(room, newPosition, total);
            const owner = room.players.find((p) => p.id === owned.ownerId);
            if (owner && !owner.bankrupt && rent > 0) {
              player.money -= rent;
              owner.money += rent;
              result.money = player.money;
              result.landingAction = {
                type: 'rent', rent, ownerName: owner.name, ownerId: owner.id,
                payerMoney: player.money, ownerMoney: owner.money,
              };
              if (player.money < 0) {
                goBankrupt(room, player);
                result.landingAction.bankrupt = true;
                const w = checkWinCondition(room);
                if (w) result.winner = { id: w.id, name: w.name };
              }
            }
          }
        }
      }
    }

    return result;
  }

  // No doubles
  if (player.jailTurns >= MAX_JAIL_TURNS) {
    // Forced to pay
    player.money -= JAIL_FINE;
    player.inJail = false;
    player.jailTurns = 0;
    room.log.push(`${player.name} couldn't roll doubles — forced to pay $${JAIL_FINE}`);

    if (player.money < 0) {
      goBankrupt(room, player);
      const w = checkWinCondition(room);
      return {
        success: true, freed: true, forcedPay: true, bankrupt: true,
        die1, die2, money: player.money,
        playerId: player.id, playerName: player.name,
        winner: w ? { id: w.id, name: w.name } : null,
      };
    }

    return {
      success: true, freed: true, forcedPay: true, bankrupt: false,
      die1, die2, money: player.money,
      playerId: player.id, playerName: player.name,
    };
  }

  room.log.push(`${player.name} failed to roll doubles (attempt ${player.jailTurns}/${MAX_JAIL_TURNS})`);

  return {
    success: true, freed: false,
    die1, die2, attemptsLeft: MAX_JAIL_TURNS - player.jailTurns,
    playerId: player.id, playerName: player.name,
  };
}

// ═══════════════════════════════════════════════════════════════════
// BUY PROPERTY
// ═══════════════════════════════════════════════════════════════════

export function buyProperty(code, socketId, spaceId) {
  const room = rooms.get(code);
  if (!room || room.status !== 'playing') return { error: 'No active game.' };

  const currentPlayer = getCurrentPlayer(room);
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
    houses: 0,
    mortgaged: false,
  };

  room.log.push(`${currentPlayer.name} bought space ${spaceId} for $${propData.price}`);

  return {
    success: true, spaceId,
    ownerId: currentPlayer.id, ownerName: currentPlayer.name,
    price: propData.price, money: currentPlayer.money,
  };
}

// ═══════════════════════════════════════════════════════════════════
// HOUSES & HOTELS
// ═══════════════════════════════════════════════════════════════════

export function buildHouse(code, socketId, spaceId) {
  const room = rooms.get(code);
  if (!room || room.status !== 'playing') return { error: 'No active game.' };

  const player = room.players.find((p) => p.id === socketId);
  if (!player) return { error: 'Player not found.' };

  const prop = room.properties[spaceId];
  const data = PROPERTY_DATA[spaceId];
  if (!prop || !data) return { error: 'Not a valid property.' };
  if (prop.ownerId !== socketId) return { error: 'You don\'t own this property.' };
  if (prop.mortgaged) return { error: 'Property is mortgaged.' };
  if (data.isRailroad || data.isUtility) return { error: 'Cannot build on railroads/utilities.' };
  if (prop.houses >= 5) return { error: 'Already has a hotel (max).' };

  // Must own all in group
  if (!ownsFullGroup(room, socketId, data.group)) {
    return { error: 'Must own all properties in the color group.' };
  }

  // Even build rule: can't build if any other property in group has fewer houses
  const groupSpaces = GROUP_SPACES[data.group];
  const minHouses = Math.min(...groupSpaces.map((id) => room.properties[id]?.houses || 0));
  if (prop.houses > minHouses) {
    return { error: 'Must build evenly across the group.' };
  }

  // Check can't build if any in group is mortgaged
  if (groupSpaces.some((id) => room.properties[id]?.mortgaged)) {
    return { error: 'Cannot build while any property in group is mortgaged.' };
  }

  const cost = data.houseCost;
  if (player.money < cost) return { error: `Not enough money. Need $${cost}.` };

  player.money -= cost;
  prop.houses++;

  const level = prop.houses === 5 ? 'hotel' : `house #${prop.houses}`;
  room.log.push(`${player.name} built ${level} on space ${spaceId} for $${cost}`);

  return {
    success: true, spaceId, houses: prop.houses, cost,
    playerId: player.id, playerName: player.name, money: player.money,
  };
}

// ═══════════════════════════════════════════════════════════════════
// MORTGAGE
// ═══════════════════════════════════════════════════════════════════

export function mortgageProperty(code, socketId, spaceId) {
  const room = rooms.get(code);
  if (!room || room.status !== 'playing') return { error: 'No active game.' };

  const player = room.players.find((p) => p.id === socketId);
  if (!player) return { error: 'Player not found.' };

  const prop = room.properties[spaceId];
  const data = PROPERTY_DATA[spaceId];
  if (!prop || !data) return { error: 'Not a valid property.' };
  if (prop.ownerId !== socketId) return { error: 'You don\'t own this property.' };
  if (prop.mortgaged) return { error: 'Already mortgaged.' };
  if (prop.houses > 0) return { error: 'Sell all houses first.' };

  prop.mortgaged = true;
  player.money += data.mortgage;

  room.log.push(`${player.name} mortgaged space ${spaceId} for $${data.mortgage}`);

  return {
    success: true, spaceId, mortgaged: true,
    mortgageValue: data.mortgage,
    playerId: player.id, playerName: player.name, money: player.money,
  };
}

export function unmortgageProperty(code, socketId, spaceId) {
  const room = rooms.get(code);
  if (!room || room.status !== 'playing') return { error: 'No active game.' };

  const player = room.players.find((p) => p.id === socketId);
  if (!player) return { error: 'Player not found.' };

  const prop = room.properties[spaceId];
  const data = PROPERTY_DATA[spaceId];
  if (!prop || !data) return { error: 'Not a valid property.' };
  if (prop.ownerId !== socketId) return { error: 'You don\'t own this property.' };
  if (!prop.mortgaged) return { error: 'Not mortgaged.' };

  const cost = Math.ceil(data.mortgage * 1.1); // 10% interest
  if (player.money < cost) return { error: `Not enough money. Need $${cost}.` };

  prop.mortgaged = false;
  player.money -= cost;

  room.log.push(`${player.name} unmortgaged space ${spaceId} for $${cost}`);

  return {
    success: true, spaceId, mortgaged: false,
    cost, playerId: player.id, playerName: player.name, money: player.money,
  };
}

// ═══════════════════════════════════════════════════════════════════
// TRADING
// ═══════════════════════════════════════════════════════════════════

let tradeIdCounter = 0;

export function proposeTrade(code, socketId, { targetId, offerProps, offerMoney, wantProps, wantMoney }) {
  const room = rooms.get(code);
  if (!room || room.status !== 'playing') return { error: 'No active game.' };
  if (room.pendingTrade) return { error: 'A trade is already pending.' };

  const from = room.players.find((p) => p.id === socketId);
  const to = room.players.find((p) => p.id === targetId);
  if (!from || !to) return { error: 'Invalid players.' };
  if (from.bankrupt || to.bankrupt) return { error: 'Cannot trade with bankrupt player.' };

  // Validate offered properties belong to from player + no houses
  for (const propId of (offerProps || [])) {
    const prop = room.properties[propId];
    if (!prop || prop.ownerId !== socketId) return { error: `You don't own space ${propId}.` };
    if (prop.houses > 0) return { error: 'Sell houses before trading.' };
  }

  // Validate wanted properties belong to target + no houses
  for (const propId of (wantProps || [])) {
    const prop = room.properties[propId];
    if (!prop || prop.ownerId !== targetId) return { error: `Target doesn't own space ${propId}.` };
    if (prop.houses > 0) return { error: 'Target must sell houses before trading.' };
  }

  if ((offerMoney || 0) > from.money) return { error: 'Not enough money to offer.' };
  if ((wantMoney || 0) > to.money) return { error: 'Target doesn\'t have enough money.' };

  const trade = {
    id: ++tradeIdCounter,
    fromId: socketId, fromName: from.name,
    toId: targetId, toName: to.name,
    offerProps: offerProps || [], offerMoney: offerMoney || 0,
    wantProps: wantProps || [], wantMoney: wantMoney || 0,
  };

  room.pendingTrade = trade;
  return { success: true, trade };
}

export function respondTrade(code, socketId, accept) {
  const room = rooms.get(code);
  if (!room || room.status !== 'playing') return { error: 'No active game.' };
  if (!room.pendingTrade) return { error: 'No pending trade.' };

  const trade = room.pendingTrade;
  if (trade.toId !== socketId) return { error: 'This trade is not for you.' };

  room.pendingTrade = null;

  if (!accept) {
    room.log.push(`${trade.toName} rejected trade from ${trade.fromName}`);
    return { success: true, accepted: false, trade };
  }

  // Execute trade
  const from = room.players.find((p) => p.id === trade.fromId);
  const to = room.players.find((p) => p.id === trade.toId);
  if (!from || !to) return { error: 'Trade players not found.' };

  // Transfer properties
  for (const propId of trade.offerProps) {
    room.properties[propId].ownerId = to.id;
    room.properties[propId].ownerName = to.name;
  }
  for (const propId of trade.wantProps) {
    room.properties[propId].ownerId = from.id;
    room.properties[propId].ownerName = from.name;
  }

  // Transfer money
  from.money -= trade.offerMoney;
  from.money += trade.wantMoney;
  to.money += trade.offerMoney;
  to.money -= trade.wantMoney;

  room.log.push(`${from.name} traded with ${to.name}`);

  return {
    success: true, accepted: true, trade,
    fromMoney: from.money, toMoney: to.money,
  };
}

// ═══════════════════════════════════════════════════════════════════
// AUCTIONS
// ═══════════════════════════════════════════════════════════════════

export function startAuction(code, spaceId) {
  const room = rooms.get(code);
  if (!room || room.status !== 'playing') return { error: 'No active game.' };
  if (room.auction) return { error: 'Auction already in progress.' };

  const data = PROPERTY_DATA[spaceId];
  if (!data) return { error: 'Not a property.' };
  if (room.properties[spaceId]) return { error: 'Already owned.' };

  room.auction = {
    spaceId,
    price: data.price,
    highBid: 0,
    highBidder: null,
    highBidderName: null,
    startTime: Date.now(),
  };

  return { success: true, auction: room.auction };
}

export function placeBid(code, socketId, amount) {
  const room = rooms.get(code);
  if (!room || room.status !== 'playing') return { error: 'No active game.' };
  if (!room.auction) return { error: 'No auction in progress.' };

  const player = room.players.find((p) => p.id === socketId);
  if (!player || player.bankrupt) return { error: 'Invalid player.' };
  if (amount <= room.auction.highBid) return { error: `Bid must be higher than $${room.auction.highBid}.` };
  if (amount > player.money) return { error: 'Not enough money.' };

  room.auction.highBid = amount;
  room.auction.highBidder = socketId;
  room.auction.highBidderName = player.name;

  return {
    success: true,
    highBid: amount, highBidder: socketId, highBidderName: player.name,
  };
}

export function endAuction(code) {
  const room = rooms.get(code);
  if (!room || !room.auction) return { error: 'No auction.' };

  const auction = room.auction;
  room.auction = null;

  if (!auction.highBidder || auction.highBid <= 0) {
    room.log.push('Auction ended — no bids, property remains unowned');
    return { success: true, sold: false, spaceId: auction.spaceId };
  }

  const winner = room.players.find((p) => p.id === auction.highBidder);
  if (!winner) return { success: true, sold: false, spaceId: auction.spaceId };

  const data = PROPERTY_DATA[auction.spaceId];
  winner.money -= auction.highBid;
  room.properties[auction.spaceId] = {
    ownerId: winner.id,
    ownerName: winner.name,
    price: data.price,
    houses: 0,
    mortgaged: false,
  };

  room.log.push(`${winner.name} won auction for space ${auction.spaceId} at $${auction.highBid}`);

  return {
    success: true, sold: true,
    spaceId: auction.spaceId,
    winnerId: winner.id, winnerName: winner.name,
    winningBid: auction.highBid, money: winner.money,
  };
}

// ═══════════════════════════════════════════════════════════════════
// END TURN
// ═══════════════════════════════════════════════════════════════════

export function endTurn(code, socketId) {
  const room = rooms.get(code);
  if (!room || room.status !== 'playing') return { error: 'No active game.' };

  const currentPlayer = getCurrentPlayer(room);
  if (currentPlayer.id !== socketId) return { error: 'Not your turn.' };

  advanceTurn(room);

  const next = getCurrentPlayer(room);
  return {
    success: true,
    currentPlayerIndex: room.currentPlayerIndex,
    currentPlayerId: next.id,
    currentPlayerName: next.name,
    inJail: next.inJail,
    jailTurns: next.jailTurns,
  };
}

// ═══════════════════════════════════════════════════════════════════
// GAME STATE SERIALIZATION
// ═══════════════════════════════════════════════════════════════════

export function getGameState(code) {
  const room = rooms.get(code);
  if (!room) return null;
  return {
    players: room.players.map((p) => ({
      id: p.id, name: p.name, color: p.color,
      position: p.position, money: p.money,
      inJail: p.inJail, jailTurns: p.jailTurns, bankrupt: p.bankrupt,
    })),
    currentPlayerIndex: room.currentPlayerIndex,
    currentPlayerId: room.players[room.currentPlayerIndex]?.id,
    properties: room.properties,
    pendingTrade: room.pendingTrade,
    auction: room.auction,
    winner: room.winner,
    status: room.status,
  };
}
