import express from 'express';
import path from 'path';
import fs from 'fs';
import http from 'http';
import { fileURLToPath } from 'url';
import { Server } from 'socket.io';
import { nanoid } from 'nanoid';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
});

const PORT = process.env.PORT || 4000;
const INSTRUCTOR_PASSWORD = process.env.INSTRUCTOR_PASSWORD || '';
const LEADERBOARD_FILE = path.join(__dirname, 'leaderboard.json');

app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'dist')));

// ── Types ──────────────────────────────────────────────

interface GameConfig {
  price: number;
  cost: number;
  salvage: number;
  mu: number;
  sigma: number;
  rounds: number;
  seed: number;
  mode: string;
}

interface RoundResult {
  day: number;
  order: number;
  demand: number;
  sold: number;
  wasted: number;
  shortage: number;
  revenue: number;
  dailyCost: number;
  salvageValue: number;
  profit: number;
  cumulativeProfit: number;
}

interface PlayerData {
  name: string;
  socketId: string | null;
  rounds: RoundResult[];
  cumulativeProfit: number;
  currentOrder: number | null;
  hasSubmitted: boolean;
}

interface GameRoom {
  gameCode: string;
  phase: 'lobby' | 'playing' | 'debrief';
  config: GameConfig;
  demands: number[];
  currentRound: number;
  showingResults: boolean;
  players: Map<string, PlayerData>; // keyed by playerName
  instructorSocketId: string | null;
  advanceMode: 'manual' | 'timer' | 'auto';
  timerDuration: number;
  timerRemaining: number | null;
  timerInterval: ReturnType<typeof setInterval> | null;
}

// ── In-memory state ────────────────────────────────────

const rooms = new Map<string, GameRoom>();

// ── Demand generation (same as client) ─────────────────

function mulberry32(seed: number): () => number {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function generateDemand(seed: number, rounds: number, mu: number, sigma: number): number[] {
  const rng = mulberry32(seed);
  const demands: number[] = [];
  for (let i = 0; i < rounds; i++) {
    const u1 = rng();
    const u2 = rng();
    const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    demands.push(Math.max(0, Math.round(mu + sigma * z)));
  }
  return demands;
}

function dateSeed(): number {
  const now = new Date();
  return now.getFullYear() * 10000 + (now.getMonth() + 1) * 100 + now.getDate();
}

// ── Game logic ─────────────────────────────────────────

function calculateRound(
  config: GameConfig,
  day: number,
  order: number,
  demand: number,
  prevCumulativeProfit: number
): RoundResult {
  const sold = Math.min(order, demand);
  const wasted = Math.max(order - demand, 0);
  const shortage = Math.max(demand - order, 0);
  const revenue = sold * config.price;
  const dailyCost = order * config.cost;
  const salvageValue = wasted * config.salvage;
  const profit = revenue - dailyCost + salvageValue;
  return {
    day,
    order,
    demand,
    sold,
    wasted,
    shortage,
    revenue,
    dailyCost,
    salvageValue,
    profit,
    cumulativeProfit: prevCumulativeProfit + profit,
  };
}

// ── Room code generation ───────────────────────────────

function generateRoomCode(): string {
  let code: string;
  do {
    code = nanoid(6).toUpperCase().replace(/[^A-Z0-9]/g, 'X');
  } while (rooms.has(code));
  return code;
}

// ── State broadcasting ─────────────────────────────────

function getPlayerSummary(p: PlayerData) {
  const orders = p.rounds.map((r) => r.order);
  const avgOrder = orders.length > 0 ? orders.reduce((s, v) => s + v, 0) / orders.length : 0;
  const last = p.rounds[p.rounds.length - 1];
  return {
    name: p.name,
    connected: p.socketId !== null,
    currentOrder: p.currentOrder,
    hasSubmitted: p.hasSubmitted,
    cumulativeProfit: p.cumulativeProfit,
    roundsPlayed: p.rounds.length,
    avgOrder: Math.round(avgOrder * 10) / 10,
    lastOrder: last?.order ?? null,
    lastDemand: last?.demand ?? null,
  };
}

function getRoomState(room: GameRoom) {
  const players: Record<string, ReturnType<typeof getPlayerSummary>> = {};
  for (const [name, p] of room.players) {
    players[name] = getPlayerSummary(p);
  }
  return {
    gameCode: room.gameCode,
    phase: room.phase,
    config: room.config,
    currentRound: room.currentRound,
    showingResults: room.showingResults,
    players,
    timerRemaining: room.timerRemaining,
    advanceMode: room.advanceMode,
    timerDuration: room.timerDuration,
  };
}

function getPlayerGameState(room: GameRoom, player: PlayerData) {
  // Only reveal demands up to what's been shown
  const revealedCount = room.showingResults ? room.currentRound : room.currentRound - 1;
  const revealedDemands = room.demands.slice(0, Math.max(0, revealedCount));
  const currentResult = room.showingResults && player.rounds.length > 0
    ? player.rounds[player.rounds.length - 1]
    : null;

  return {
    gameCode: room.gameCode,
    playerName: player.name,
    phase: room.phase,
    config: { ...room.config, mu: 0, sigma: 0 }, // hide distribution params during play
    currentRound: room.currentRound,
    showingResults: room.showingResults,
    rounds: player.rounds,
    cumulativeProfit: player.cumulativeProfit,
    demands: revealedDemands,
    timerRemaining: room.timerRemaining,
    currentResult,
  };
}

function getDebriefData(room: GameRoom) {
  const players: Record<string, any> = {};
  for (const [name, p] of room.players) {
    const totalDemand = room.demands.reduce((s, d) => s + d, 0);
    const totalSold = p.rounds.reduce((s, r) => s + r.sold, 0);
    const orders = p.rounds.map((r) => r.order);
    const avgOrder = orders.length > 0 ? orders.reduce((s, v) => s + v, 0) / orders.length : 0;
    players[name] = {
      name: p.name,
      rounds: p.rounds,
      totalProfit: p.cumulativeProfit,
      avgOrder,
      avgDemand: room.config.mu,
      totalWasted: p.rounds.reduce((s, r) => s + r.wasted, 0),
      totalShortage: p.rounds.reduce((s, r) => s + r.shortage, 0),
      fillRate: totalDemand > 0 ? totalSold / totalDemand : 1,
    };
  }
  return {
    gameCode: room.gameCode,
    config: room.config,
    demands: room.demands,
    players,
  };
}

function broadcastRoomState(room: GameRoom) {
  if (room.instructorSocketId) {
    io.to(room.instructorSocketId).emit('room-state', getRoomState(room));
  }
}

function sendPlayerState(room: GameRoom, player: PlayerData) {
  if (player.socketId) {
    io.to(player.socketId).emit('player-game-state', getPlayerGameState(room, player));
  }
}

function sendAllPlayerStates(room: GameRoom) {
  for (const [, player] of room.players) {
    sendPlayerState(room, player);
  }
}

// ── Timer management ───────────────────────────────────

function startTimer(room: GameRoom) {
  stopTimer(room);
  room.timerRemaining = room.timerDuration;

  room.timerInterval = setInterval(() => {
    if (room.timerRemaining === null) return;
    room.timerRemaining--;

    // Broadcast tick to all participants
    const allSocketIds: string[] = [];
    if (room.instructorSocketId) allSocketIds.push(room.instructorSocketId);
    for (const [, p] of room.players) {
      if (p.socketId) allSocketIds.push(p.socketId);
    }
    for (const sid of allSocketIds) {
      io.to(sid).emit('timer-tick', room.timerRemaining);
    }

    if (room.timerRemaining <= 0) {
      if (room.showingResults) {
        advanceToNextRound(room);
      } else {
        revealDemand(room);
      }
    }
  }, 1000);
}

function stopTimer(room: GameRoom) {
  if (room.timerInterval) {
    clearInterval(room.timerInterval);
    room.timerInterval = null;
  }
  room.timerRemaining = null;
}

// ── Round management ───────────────────────────────────

function revealDemand(room: GameRoom) {
  const roundIndex = room.currentRound - 1;
  const demand = room.demands[roundIndex];

  // Process each player's order
  for (const [, player] of room.players) {
    const order = player.hasSubmitted && player.currentOrder !== null
      ? player.currentOrder
      : Math.round(room.config.mu); // default order if not submitted

    const result = calculateRound(
      room.config,
      room.currentRound,
      order,
      demand,
      player.cumulativeProfit
    );

    player.rounds.push(result);
    player.cumulativeProfit = result.cumulativeProfit;
    player.currentOrder = null;
    player.hasSubmitted = false;
  }

  room.showingResults = true;

  broadcastRoomState(room);
  sendAllPlayerStates(room);

  // In timer mode, restart timer for the result viewing phase
  if (room.advanceMode === 'timer') {
    startTimer(room);
  }
}

function advanceToNextRound(room: GameRoom) {
  if (room.currentRound >= room.config.rounds) {
    // Game over
    room.phase = 'debrief';
    stopTimer(room);
    broadcastRoomState(room);
    sendAllPlayerStates(room);

    // Send debrief data
    const debriefData = getDebriefData(room);
    if (room.instructorSocketId) {
      io.to(room.instructorSocketId).emit('debrief-data', debriefData);
    }
    for (const [, p] of room.players) {
      if (p.socketId) {
        io.to(p.socketId).emit('debrief-data', debriefData);
      }
    }
    return;
  }

  room.currentRound++;
  room.showingResults = false;

  broadcastRoomState(room);
  sendAllPlayerStates(room);

  // Restart timer for order phase
  if (room.advanceMode === 'timer') {
    startTimer(room);
  }
}

function checkAutoAdvance(room: GameRoom) {
  if (room.phase !== 'playing' || room.showingResults) return;

  const activePlayers = Array.from(room.players.values()).filter((p) => p.connected);
  if (activePlayers.length === 0) return;

  const allSubmitted = activePlayers.every((p) => p.hasSubmitted);
  if (allSubmitted) {
    if (room.advanceMode === 'auto') {
      revealDemand(room);
    }
    // Notify instructor of all submitted
    broadcastRoomState(room);
  }
}

// ── Socket.IO event handlers ───────────────────────────

io.on('connection', (socket) => {
  console.log(`Connected: ${socket.id}`);

  // ── Instructor: Create Game ──
  socket.on('create-game', (payload, callback) => {
    const { config, advanceMode, timerDuration, password } = payload;

    if (INSTRUCTOR_PASSWORD && password !== INSTRUCTOR_PASSWORD) {
      return callback({ success: false, error: 'Invalid password' });
    }

    const gameCode = generateRoomCode();
    const seed = config.seed || dateSeed();
    const fullConfig: GameConfig = {
      price: config.price ?? 6,
      cost: config.cost ?? 2,
      salvage: config.salvage ?? 0.5,
      mu: config.mu ?? 100,
      sigma: config.sigma ?? 30,
      rounds: config.rounds ?? 30,
      seed,
      mode: config.mode ?? 'medium',
    };

    const demands = generateDemand(seed, fullConfig.rounds, fullConfig.mu, fullConfig.sigma);

    const room: GameRoom = {
      gameCode,
      phase: 'lobby',
      config: fullConfig,
      demands,
      currentRound: 1,
      showingResults: false,
      players: new Map(),
      instructorSocketId: socket.id,
      advanceMode: advanceMode || 'manual',
      timerDuration: timerDuration || 30,
      timerRemaining: null,
      timerInterval: null,
    };

    rooms.set(gameCode, room);
    socket.join(gameCode);
    console.log(`Game created: ${gameCode}`);

    callback({ success: true, gameCode });
    broadcastRoomState(room);
  });

  // ── Instructor: Rejoin ──
  socket.on('instructor-rejoin', (payload, callback) => {
    const { gameCode, password } = payload;
    const room = rooms.get(gameCode);

    if (!room) return callback({ success: false, error: 'Game not found' });
    if (INSTRUCTOR_PASSWORD && password !== INSTRUCTOR_PASSWORD) {
      return callback({ success: false, error: 'Invalid password' });
    }

    room.instructorSocketId = socket.id;
    socket.join(gameCode);
    callback({ success: true });
    broadcastRoomState(room);
  });

  // ── Instructor: Start Game ──
  socket.on('start-game', (gameCode) => {
    const room = rooms.get(gameCode);
    if (!room || room.phase !== 'lobby') return;
    if (room.players.size === 0) return;

    room.phase = 'playing';
    room.currentRound = 1;
    room.showingResults = false;

    broadcastRoomState(room);
    sendAllPlayerStates(room);

    if (room.advanceMode === 'timer') {
      startTimer(room);
    }
  });

  // ── Instructor: Reveal Demand (advance from ordering to results) ──
  socket.on('reveal-demand', (gameCode) => {
    const room = rooms.get(gameCode);
    if (!room || room.phase !== 'playing' || room.showingResults) return;
    revealDemand(room);
  });

  // ── Instructor: Next Round (advance from results to next round) ──
  socket.on('next-round', (gameCode) => {
    const room = rooms.get(gameCode);
    if (!room || room.phase !== 'playing' || !room.showingResults) return;
    advanceToNextRound(room);
  });

  // ── Instructor: Start/Pause Timer ──
  socket.on('start-timer', (gameCode) => {
    const room = rooms.get(gameCode);
    if (!room || room.phase !== 'playing') return;
    startTimer(room);
  });

  socket.on('pause-timer', (gameCode) => {
    const room = rooms.get(gameCode);
    if (!room) return;
    stopTimer(room);
    broadcastRoomState(room);
  });

  // ── Instructor: End Game ──
  socket.on('end-game', (gameCode) => {
    const room = rooms.get(gameCode);
    if (!room) return;

    room.phase = 'debrief';
    stopTimer(room);

    const debriefData = getDebriefData(room);
    broadcastRoomState(room);
    sendAllPlayerStates(room);

    if (room.instructorSocketId) {
      io.to(room.instructorSocketId).emit('debrief-data', debriefData);
    }
    for (const [, p] of room.players) {
      if (p.socketId) {
        io.to(p.socketId).emit('debrief-data', debriefData);
      }
    }
  });

  // ── Player: Join Game ──
  socket.on('join-game', (payload, callback) => {
    const { gameCode, playerName } = payload;
    const room = rooms.get(gameCode);

    if (!room) return callback({ success: false, error: 'Game not found' });

    const trimmedName = playerName.trim().slice(0, 30);
    if (!trimmedName) return callback({ success: false, error: 'Name required' });

    const existingPlayer = room.players.get(trimmedName);
    if (existingPlayer) {
      // Reconnect
      existingPlayer.socketId = socket.id;
      socket.join(gameCode);
      callback({ success: true, reconnected: true });
      sendPlayerState(room, existingPlayer);
      broadcastRoomState(room);
      return;
    }

    if (room.phase !== 'lobby') {
      return callback({ success: false, error: 'Game already in progress' });
    }

    const player: PlayerData = {
      name: trimmedName,
      socketId: socket.id,
      rounds: [],
      cumulativeProfit: 0,
      currentOrder: null,
      hasSubmitted: false,
    };

    room.players.set(trimmedName, player);
    socket.join(gameCode);

    callback({ success: true, reconnected: false });
    sendPlayerState(room, player);
    broadcastRoomState(room);
  });

  // ── Player: Submit Order ──
  socket.on('submit-order', (payload, callback) => {
    const { gameCode, playerName, order } = payload;
    const room = rooms.get(gameCode);

    if (!room || room.phase !== 'playing' || room.showingResults) {
      return callback?.({ success: false, error: 'Cannot submit now' });
    }

    const player = room.players.get(playerName);
    if (!player) return callback?.({ success: false, error: 'Player not found' });

    player.currentOrder = Math.max(0, Math.min(300, Math.round(order)));
    player.hasSubmitted = true;

    callback?.({ success: true });
    sendPlayerState(room, player);
    broadcastRoomState(room);
    checkAutoAdvance(room);
  });

  // ── Player: Request debrief ──
  socket.on('request-debrief', (payload) => {
    const { gameCode } = payload;
    const room = rooms.get(gameCode);
    if (!room || room.phase !== 'debrief') return;

    const debriefData = getDebriefData(room);
    socket.emit('debrief-data', debriefData);
  });

  // ── Disconnect handling ──
  socket.on('disconnect', () => {
    console.log(`Disconnected: ${socket.id}`);

    for (const [, room] of rooms) {
      if (room.instructorSocketId === socket.id) {
        room.instructorSocketId = null;
        broadcastRoomState(room);
      }

      for (const [, player] of room.players) {
        if (player.socketId === socket.id) {
          player.socketId = null;
          broadcastRoomState(room);
        }
      }
    }
  });
});

// ── Leaderboard REST API ───────────────────────────────

interface LeaderboardEntry {
  playerName: string;
  seed: number;
  mode: string;
  totalProfit: number;
  avgOrder: number;
  rounds: number;
  timestamp: string;
}

function readLeaderboard(): LeaderboardEntry[] {
  try {
    if (fs.existsSync(LEADERBOARD_FILE)) {
      return JSON.parse(fs.readFileSync(LEADERBOARD_FILE, 'utf-8'));
    }
  } catch {
    // ignore
  }
  return [];
}

function writeLeaderboard(entries: LeaderboardEntry[]) {
  fs.writeFileSync(LEADERBOARD_FILE, JSON.stringify(entries, null, 2));
}

app.post('/api/results', (req, res) => {
  const { playerName, seed, mode, totalProfit, avgOrder, rounds } = req.body;
  if (!playerName || seed === undefined || totalProfit === undefined) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  const entry: LeaderboardEntry = {
    playerName: String(playerName).slice(0, 50),
    seed: Number(seed),
    mode: String(mode),
    totalProfit: Number(totalProfit),
    avgOrder: Number(avgOrder),
    rounds: Number(rounds),
    timestamp: new Date().toISOString(),
  };
  const leaderboard = readLeaderboard();
  leaderboard.push(entry);
  writeLeaderboard(leaderboard);
  res.json({ success: true });
});

app.get('/api/leaderboard', (req, res) => {
  const seed = req.query.seed ? Number(req.query.seed) : undefined;
  let leaderboard = readLeaderboard();
  if (seed !== undefined) {
    leaderboard = leaderboard.filter((e) => e.seed === seed);
  }
  leaderboard.sort((a, b) => b.totalProfit - a.totalProfit);
  res.json(leaderboard);
});

// SPA fallback
app.get('*', (_req, res) => {
  res.sendFile(path.join(__dirname, '..', 'dist', 'index.html'));
});

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
