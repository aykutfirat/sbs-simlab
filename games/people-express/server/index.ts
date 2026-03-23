import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { nanoid } from 'nanoid';
import { SimulationEngine } from '../src/engine/SimulationEngine.js';
import { quarterLabel } from '../src/utils/formatting.js';
import type {
  PlayerDecisions,
  QuarterRecord,
  SimulationState,
  RoomConfig,
  RoomPhase,
  RoomState,
  TeamSummary,
  TeamGameStatePayload,
} from '../src/types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ── Types ──────────────────────────────────────────────────────

interface TeamData {
  engine: SimulationEngine;
  currentState: SimulationState;
  history: QuarterRecord[];
  decisions: PlayerDecisions;
  hasSubmitted: boolean;
  socketId: string | null;
}

interface GameRoom {
  gameCode: string;
  config: RoomConfig;
  phase: RoomPhase;
  teams: Map<string, TeamData>;
  instructorSocketId: string | null;
  timerRemaining: number | null;
  timerInterval: ReturnType<typeof setInterval> | null;
  currentQuarter: number;
}

const INSTRUCTOR_PASSWORD = process.env.INSTRUCTOR_PASSWORD || '';

function checkInstructorAuth(password: string): boolean {
  if (!INSTRUCTOR_PASSWORD) return true; // no password configured = open
  return password === INSTRUCTOR_PASSWORD;
}

const DEFAULT_DECISIONS: PlayerDecisions = {
  aircraftPurchases: 0,
  peopleFare: 0.09,
  marketingFraction: 0.10,
  hiring: 9,
  targetServiceScope: 0.60,
};

// ── In-memory store ────────────────────────────────────────────

const rooms = new Map<string, GameRoom>();

function generateGameCode(): string {
  return nanoid(6).toUpperCase();
}

// ── Express + Socket.IO setup ──────────────────────────────────

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

const PORT = process.env.PORT || 3001;

// Password verification endpoint
app.use(express.json());
app.post('/api/verify-password', (req, res) => {
  const { password } = req.body;
  if (checkInstructorAuth(password)) {
    res.json({ success: true });
  } else {
    res.status(401).json({ success: false, error: 'Invalid password.' });
  }
});

// Serve built frontend in production
app.use(express.static(join(__dirname, '..', 'dist')));
app.get('*', (_req, res) => {
  res.sendFile(join(__dirname, '..', 'dist', 'index.html'));
});

// ── Helpers ────────────────────────────────────────────────────

function getTeamSummary(teamName: string, team: TeamData): TeamSummary {
  return {
    teamName,
    connectionStatus: team.socketId ? 'connected' : 'disconnected',
    hasSubmitted: team.hasSubmitted,
    isBankrupt: team.currentState.isBankrupt,
    currentState: team.currentState,
    history: team.history,
    decisions: team.decisions,
  };
}

function getRoomState(room: GameRoom): RoomState {
  const teams: Record<string, TeamSummary> = {};
  for (const [name, team] of room.teams) {
    teams[name] = getTeamSummary(name, team);
  }
  return {
    gameCode: room.gameCode,
    phase: room.phase,
    config: room.config,
    teams,
    timerRemaining: room.timerRemaining,
    currentQuarter: room.currentQuarter,
  };
}

function broadcastRoomState(room: GameRoom) {
  // Send full room state to instructor
  if (room.instructorSocketId) {
    io.to(room.instructorSocketId).emit('room-state', getRoomState(room));
  }
}

function sendTeamState(room: GameRoom, teamName: string, team: TeamData) {
  if (!team.socketId) return;
  const payload: TeamGameStatePayload = {
    currentState: team.currentState,
    history: team.history,
    decisions: team.decisions,
    hasSubmitted: team.hasSubmitted,
    phase: room.phase,
    timerRemaining: room.timerRemaining,
    currentQuarter: room.currentQuarter,
  };
  io.to(team.socketId).emit('team-game-state', payload);
}

function advanceAllTeams(room: GameRoom) {
  for (const [teamName, team] of room.teams) {
    if (team.currentState.isGameOver) continue;

    const decisions = team.hasSubmitted ? team.decisions : team.decisions; // use last decisions if not submitted
    const newState = team.engine.advanceQuarter(decisions);
    const record: QuarterRecord = {
      quarter: newState.quarter,
      label: quarterLabel(newState.quarter),
      state: newState,
    };

    team.currentState = newState;
    team.history = [...team.history, record];
    team.hasSubmitted = false;

    sendTeamState(room, teamName, team);
  }

  // Update room quarter from any non-gameover team
  for (const team of room.teams.values()) {
    if (!team.currentState.isGameOver) {
      room.currentQuarter = team.currentState.quarter;
      break;
    }
  }

  // Check if all teams are game over
  const allGameOver = Array.from(room.teams.values()).every(t => t.currentState.isGameOver);
  if (allGameOver && room.teams.size > 0) {
    room.phase = 'gameover';
    stopTimer(room);
  }

  broadcastRoomState(room);
}

function startTimer(room: GameRoom) {
  stopTimer(room);
  room.timerRemaining = room.config.timerDuration;

  room.timerInterval = setInterval(() => {
    if (room.timerRemaining === null) return;
    room.timerRemaining--;

    // Broadcast tick to all in room
    const roomSocketIds: string[] = [];
    if (room.instructorSocketId) roomSocketIds.push(room.instructorSocketId);
    for (const team of room.teams.values()) {
      if (team.socketId) roomSocketIds.push(team.socketId);
    }
    for (const sid of roomSocketIds) {
      io.to(sid).emit('timer-tick', room.timerRemaining);
    }

    if (room.timerRemaining <= 0) {
      // Auto-advance
      advanceAllTeams(room);

      // Restart timer if game still going
      if (room.phase === 'playing') {
        room.timerRemaining = room.config.timerDuration;
      } else {
        stopTimer(room);
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

// ── Socket.IO Events ───────────────────────────────────────────

io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`);

  // ── Instructor: Create Game ──
  socket.on('create-game', (payload: { config: RoomConfig; password: string }, callback: (response: { gameCode?: string; error?: string }) => void) => {
    if (!checkInstructorAuth(payload.password)) {
      callback({ error: 'Invalid instructor password.' });
      return;
    }
    const { config } = payload;
    const gameCode = generateGameCode();
    const room: GameRoom = {
      gameCode,
      config,
      phase: 'lobby',
      teams: new Map(),
      instructorSocketId: socket.id,
      timerRemaining: null,
      timerInterval: null,
      currentQuarter: 0,
    };
    rooms.set(gameCode, room);
    socket.join(gameCode);
    console.log(`Game created: ${gameCode}`);
    callback({ gameCode });
    broadcastRoomState(room);
  });

  // ── Instructor: Rejoin ──
  socket.on('instructor-rejoin', (payload: { gameCode: string; password: string }) => {
    if (!checkInstructorAuth(payload.password)) {
      socket.emit('error-message', 'Invalid instructor password.');
      return;
    }
    const room = rooms.get(payload.gameCode);
    if (!room) {
      socket.emit('error-message', 'Game not found');
      return;
    }
    room.instructorSocketId = socket.id;
    socket.join(payload.gameCode);
    broadcastRoomState(room);
  });

  // ── Instructor: Start Game ──
  socket.on('start-game', (gameCode: string) => {
    const room = rooms.get(gameCode);
    if (!room || room.instructorSocketId !== socket.id) return;
    if (room.phase !== 'lobby') return;

    room.phase = 'playing';
    broadcastRoomState(room);

    // Notify all teams
    for (const [teamName, team] of room.teams) {
      sendTeamState(room, teamName, team);
    }

    // Start timer if in timer mode
    if (room.config.advanceMode === 'timer') {
      startTimer(room);
    }
  });

  // ── Instructor: Advance All ──
  socket.on('advance-all', (gameCode: string) => {
    const room = rooms.get(gameCode);
    if (!room || room.instructorSocketId !== socket.id) return;
    if (room.phase !== 'playing') return;

    advanceAllTeams(room);
  });

  // ── Instructor: Start Timer ──
  socket.on('start-timer', (gameCode: string) => {
    const room = rooms.get(gameCode);
    if (!room || room.instructorSocketId !== socket.id) return;
    if (room.phase !== 'playing') return;

    startTimer(room);
    broadcastRoomState(room);
  });

  // ── Instructor: Pause Timer ──
  socket.on('pause-timer', (gameCode: string) => {
    const room = rooms.get(gameCode);
    if (!room || room.instructorSocketId !== socket.id) return;

    if (room.timerInterval) {
      clearInterval(room.timerInterval);
      room.timerInterval = null;
    }
    // Keep timerRemaining frozen
    broadcastRoomState(room);
  });

  // ── Instructor: End Game ──
  socket.on('end-game', (gameCode: string) => {
    const room = rooms.get(gameCode);
    if (!room || room.instructorSocketId !== socket.id) return;

    room.phase = 'gameover';
    stopTimer(room);
    broadcastRoomState(room);

    // Notify all teams
    for (const [teamName, team] of room.teams) {
      sendTeamState(room, teamName, team);
    }
  });

  // ── Team: Join Game ──
  socket.on('join-game', (payload: { gameCode: string; teamName: string }, callback: (response: { success: boolean; error?: string }) => void) => {
    const { gameCode, teamName } = payload;
    const room = rooms.get(gameCode);

    if (!room) {
      callback({ success: false, error: 'Game not found. Check the code and try again.' });
      return;
    }

    const existingTeam = room.teams.get(teamName);

    if (existingTeam) {
      // Reconnect
      existingTeam.socketId = socket.id;
      socket.join(gameCode);
      callback({ success: true });
      sendTeamState(room, teamName, existingTeam);
      broadcastRoomState(room);
      console.log(`Team "${teamName}" reconnected to ${gameCode}`);
      return;
    }

    // New team joining
    if (room.phase !== 'lobby') {
      callback({ success: false, error: 'Game already in progress.' });
      return;
    }

    if (room.teams.size >= room.config.maxTeams) {
      callback({ success: false, error: 'Game is full.' });
      return;
    }

    const engine = new SimulationEngine();
    const initialState = engine.getInitialState();
    const team: TeamData = {
      engine,
      currentState: initialState,
      history: [{ quarter: 0, label: 'Start', state: initialState }],
      decisions: { ...DEFAULT_DECISIONS },
      hasSubmitted: false,
      socketId: socket.id,
    };

    room.teams.set(teamName, team);
    socket.join(gameCode);
    callback({ success: true });
    sendTeamState(room, teamName, team);
    broadcastRoomState(room);
    console.log(`Team "${teamName}" joined ${gameCode}`);
  });

  // ── Team: Submit Decisions ──
  socket.on('submit-decisions', (payload: { gameCode: string; teamName: string; decisions: PlayerDecisions }) => {
    const { gameCode, teamName, decisions } = payload;
    const room = rooms.get(gameCode);
    if (!room) return;

    const team = room.teams.get(teamName);
    if (!team || team.socketId !== socket.id) return;
    if (room.phase !== 'playing') return;

    team.decisions = decisions;
    team.hasSubmitted = true;

    sendTeamState(room, teamName, team);
    broadcastRoomState(room);
    console.log(`Team "${teamName}" submitted decisions for ${gameCode}`);

    // Auto-advance if all active teams have submitted
    const activeTeams = Array.from(room.teams.values()).filter(t => !t.currentState.isGameOver);
    const allSubmitted = activeTeams.length > 0 && activeTeams.every(t => t.hasSubmitted);
    if (allSubmitted) {
      console.log(`All teams submitted for ${gameCode} — auto-advancing`);
      advanceAllTeams(room);
      // Reset timer if running
      if (room.phase === 'playing' && room.config.advanceMode === 'timer') {
        startTimer(room);
      }
    }
  });

  // ── Disconnect ──
  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`);

    // Find which room/team this socket belonged to
    for (const [, room] of rooms) {
      if (room.instructorSocketId === socket.id) {
        room.instructorSocketId = null;
      }
      for (const [, team] of room.teams) {
        if (team.socketId === socket.id) {
          team.socketId = null;
        }
      }
      broadcastRoomState(room);
    }
  });
});

// ── Start Server ───────────────────────────────────────────────

httpServer.listen(PORT, () => {
  console.log(`People Express Multiplayer Server running on port ${PORT}`);
});
