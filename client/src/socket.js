// ─── Socket.io Client Instance ──────────────────────────────────
import { io } from 'socket.io-client';

const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:3001';

// ── Persistent Player ID ────────────────────────────────────────
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

let _playerId = localStorage.getItem('manipaly-playerId');
if (!_playerId) {
  _playerId = generateUUID();
  localStorage.setItem('manipaly-playerId', _playerId);
}

export function getPlayerId() { return _playerId; }

// ── Session Persistence ─────────────────────────────────────────
export function saveSession(roomCode, playerName) {
  localStorage.setItem('manipaly-session', JSON.stringify({ playerId: _playerId, roomCode, playerName }));
}

export function loadSession() {
  try {
    const raw = localStorage.getItem('manipaly-session');
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

export function clearSession() {
  localStorage.removeItem('manipaly-session');
}

// ── Socket Instance ─────────────────────────────────────────────
const socket = io(SERVER_URL, {
  autoConnect: true,
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
});

socket.on('connect', () => {
  console.log('[Socket] Connected:', socket.id);
});

socket.on('disconnect', (reason) => {
  console.log('[Socket] Disconnected:', reason);
});

socket.on('connect_error', (err) => {
  console.error('[Socket] Connection error:', err.message);
});

export default socket;
