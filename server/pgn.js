// ─── PGN Encoder / Decoder for Manipaly ─────────────────────────
// Serializes and deserializes game state into a portable string
// Format: MPY:<base64(JSON)>

import crypto from 'crypto';

const PGN_PREFIX = 'MPY:';
const PGN_VERSION = 1;

// ── Encode ────────────────────────────────────────────────────────

export function encodePGN(room) {
  // Build a name lookup from player id → name
  const idToName = {};
  room.players.forEach((p) => { idToName[p.id] = p.name; });

  // Serialize players (name-based, no IDs — portable across sessions)
  const players = room.players.map((p) => ({
    name: p.name,
    position: p.position,
    money: p.money,
    color: p.color,
    inJail: p.inJail || false,
    jailTurns: p.jailTurns || 0,
    bankrupt: p.bankrupt || false,
  }));

  // Serialize properties — map ownerId to ownerName
  const properties = {};
  for (const [spaceId, prop] of Object.entries(room.properties)) {
    properties[spaceId] = {
      ownerName: idToName[prop.ownerId] || prop.ownerName || 'Unknown',
      houses: prop.houses || 0,
      mortgaged: prop.mortgaged || false,
    };
  }

  // Serialize jail-free cards — map playerId to playerName
  const jailFreeCards = {};
  if (room.jailFreeCards) {
    for (const [pid, decks] of Object.entries(room.jailFreeCards)) {
      const name = idToName[pid];
      if (name && decks.length > 0) {
        jailFreeCards[name] = [...decks];
      }
    }
  }

  const payload = {
    v: PGN_VERSION,
    uid: crypto.randomUUID(),
    ts: Date.now(),
    players,
    turn: room.currentPlayerIndex,
    properties,
    jailFreeCards,
  };

  const json = JSON.stringify(payload);
  const base64 = Buffer.from(json, 'utf-8').toString('base64');
  return PGN_PREFIX + base64;
}

// ── Decode ────────────────────────────────────────────────────────

export function decodePGN(pgnString) {
  if (!pgnString || typeof pgnString !== 'string') {
    return { error: 'PGN string is required.' };
  }

  const trimmed = pgnString.trim();
  if (!trimmed.startsWith(PGN_PREFIX)) {
    return { error: 'Invalid PGN format. Must start with "MPY:".' };
  }

  const base64Part = trimmed.slice(PGN_PREFIX.length);
  if (!base64Part) {
    return { error: 'PGN data is empty.' };
  }

  let json;
  try {
    json = Buffer.from(base64Part, 'base64').toString('utf-8');
  } catch {
    return { error: 'Failed to decode PGN data.' };
  }

  let data;
  try {
    data = JSON.parse(json);
  } catch {
    return { error: 'PGN contains invalid JSON.' };
  }

  // ── Schema validation ──────────────────────────────────────────

  if (data.v !== PGN_VERSION) {
    return { error: `Unsupported PGN version: ${data.v}. Expected ${PGN_VERSION}.` };
  }

  if (!data.uid || typeof data.uid !== 'string') {
    return { error: 'PGN is missing a unique ID.' };
  }

  if (!Array.isArray(data.players) || data.players.length < 2) {
    return { error: 'PGN must contain at least 2 players.' };
  }

  // Validate each player
  for (let i = 0; i < data.players.length; i++) {
    const p = data.players[i];
    if (!p.name || typeof p.name !== 'string') {
      return { error: `Player ${i + 1} is missing a name.` };
    }
    if (typeof p.position !== 'number' || p.position < 0 || p.position > 39) {
      return { error: `Player "${p.name}" has an invalid position.` };
    }
    if (typeof p.money !== 'number') {
      return { error: `Player "${p.name}" is missing money data.` };
    }
    if (!p.color || typeof p.color !== 'string') {
      return { error: `Player "${p.name}" is missing a color.` };
    }
  }

  // Check for duplicate names
  const names = data.players.map((p) => p.name.toLowerCase());
  if (new Set(names).size !== names.length) {
    return { error: 'PGN contains duplicate player names.' };
  }

  // Validate turn index
  if (typeof data.turn !== 'number' || data.turn < 0 || data.turn >= data.players.length) {
    return { error: 'PGN has an invalid turn index.' };
  }

  // Validate properties (optional but if present must be well-formed)
  if (data.properties && typeof data.properties === 'object') {
    for (const [spaceId, prop] of Object.entries(data.properties)) {
      const id = Number(spaceId);
      if (isNaN(id) || id < 0 || id > 39) {
        return { error: `Invalid property space ID: ${spaceId}.` };
      }
      if (!prop.ownerName || typeof prop.ownerName !== 'string') {
        return { error: `Property at space ${spaceId} is missing an owner name.` };
      }
      // Verify owner exists in player list
      if (!data.players.some((p) => p.name.toLowerCase() === prop.ownerName.toLowerCase())) {
        return { error: `Property at space ${spaceId} references unknown owner "${prop.ownerName}".` };
      }
    }
  } else {
    data.properties = {};
  }

  // Validate jailFreeCards (optional)
  if (data.jailFreeCards && typeof data.jailFreeCards === 'object') {
    for (const [name, decks] of Object.entries(data.jailFreeCards)) {
      if (!data.players.some((p) => p.name.toLowerCase() === name.toLowerCase())) {
        return { error: `Jail-free card references unknown player "${name}".` };
      }
      if (!Array.isArray(decks)) {
        return { error: `Invalid jail-free card data for "${name}".` };
      }
    }
  } else {
    data.jailFreeCards = {};
  }

  return { success: true, data };
}
