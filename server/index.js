// ─── Manipaly Server ────────────────────────────────────────────
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { registerLobbyHandlers } from './lobby.js';
import { registerGameHandlers } from './game.js';

const app = express();
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
    methods: ['GET', 'POST'],
  },
});

app.use(cors());
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

io.on('connection', (socket) => {
  console.log(`[SOCKET] Connected: ${socket.id}`);
  registerLobbyHandlers(io, socket);
  registerGameHandlers(io, socket);
});

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`\n  🎲 Manipaly server running on http://localhost:${PORT}\n`);
});
