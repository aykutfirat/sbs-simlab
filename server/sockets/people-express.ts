import type { Namespace } from 'socket.io';
import { nanoid } from 'nanoid';
import { SimulationEngine } from '../../games/people-express/src/engine/SimulationEngine.js';
import { quarterLabel } from '../../games/people-express/src/utils/formatting.js';
import type {
  PlayerDecisions,
  QuarterRecord,
  SimulationState,
  RoomConfig,
  RoomPhase,
  RoomState,
  TeamSummary,
  TeamGameStatePayload,
} from '../../games/people-express/src/types.js';

const INSTRUCTOR_PASSWORD = process.env.INSTRUCTOR_PASSWORD || '';

function checkInstructorAuth(password: string): boolean {
  if (!INSTRUCTOR_PASSWORD) return true;
  return password === INSTRUCTOR_PASSWORD;
}

const DEFAULT_DECISIONS: PlayerDecisions = {
  aircraftPurchases: 0,
  peopleFare: 0.09,
  marketingFraction: 0.10,
  hiring: 9,
  targetServiceScope: 0.60,
};

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

const rooms = new Map<string, GameRoom>();

function generateGameCode(): string {
  return nanoid(6).toUpperCase();
}

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

export function registerPeopleExpressSockets(nsp: Namespace) {
  function broadcastRoomState(room: GameRoom) {
    if (room.instructorSocketId) {
      nsp.to(room.instructorSocketId).emit('room-state', getRoomState(room));
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
    nsp.to(team.socketId).emit('team-game-state', payload);
  }

  function advanceAllTeams(room: GameRoom) {
    for (const [teamName, team] of room.teams) {
      if (team.currentState.isGameOver) continue;
      const decisions = team.hasSubmitted ? team.decisions : team.decisions;
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

    for (const team of room.teams.values()) {
      if (!team.currentState.isGameOver) {
        room.currentQuarter = team.currentState.quarter;
        break;
      }
    }

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

      const roomSocketIds: string[] = [];
      if (room.instructorSocketId) roomSocketIds.push(room.instructorSocketId);
      for (const team of room.teams.values()) {
        if (team.socketId) roomSocketIds.push(team.socketId);
      }
      for (const sid of roomSocketIds) {
        nsp.to(sid).emit('timer-tick', room.timerRemaining);
      }

      if (room.timerRemaining <= 0) {
        advanceAllTeams(room);
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

  nsp.on('connection', (socket) => {
    console.log(`[people-express] Connected: ${socket.id}`);

    socket.on('create-game', (payload: { config: RoomConfig; password: string }, callback: (response: { gameCode?: string; error?: string }) => void) => {
      if (!checkInstructorAuth(payload.password)) {
        callback({ error: 'Invalid instructor password.' });
        return;
      }
      const { config } = payload;
      const gameCode = generateGameCode();
      const room: GameRoom = {
        gameCode, config, phase: 'lobby',
        teams: new Map(), instructorSocketId: socket.id,
        timerRemaining: null, timerInterval: null, currentQuarter: 0,
      };
      rooms.set(gameCode, room);
      socket.join(gameCode);
      callback({ gameCode });
      broadcastRoomState(room);
    });

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

    socket.on('start-game', (gameCode: string) => {
      const room = rooms.get(gameCode);
      if (!room || room.instructorSocketId !== socket.id) return;
      if (room.phase !== 'lobby') return;
      room.phase = 'playing';
      broadcastRoomState(room);
      for (const [teamName, team] of room.teams) {
        sendTeamState(room, teamName, team);
      }
      if (room.config.advanceMode === 'timer') {
        startTimer(room);
      }
    });

    socket.on('advance-all', (gameCode: string) => {
      const room = rooms.get(gameCode);
      if (!room || room.instructorSocketId !== socket.id) return;
      if (room.phase !== 'playing') return;
      advanceAllTeams(room);
    });

    socket.on('start-timer', (gameCode: string) => {
      const room = rooms.get(gameCode);
      if (!room || room.instructorSocketId !== socket.id) return;
      if (room.phase !== 'playing') return;
      startTimer(room);
      broadcastRoomState(room);
    });

    socket.on('pause-timer', (gameCode: string) => {
      const room = rooms.get(gameCode);
      if (!room || room.instructorSocketId !== socket.id) return;
      if (room.timerInterval) {
        clearInterval(room.timerInterval);
        room.timerInterval = null;
      }
      broadcastRoomState(room);
    });

    socket.on('end-game', (gameCode: string) => {
      const room = rooms.get(gameCode);
      if (!room || room.instructorSocketId !== socket.id) return;
      room.phase = 'gameover';
      stopTimer(room);
      broadcastRoomState(room);
      for (const [teamName, team] of room.teams) {
        sendTeamState(room, teamName, team);
      }
    });

    socket.on('join-game', (payload: { gameCode: string; teamName: string }, callback: (response: { success: boolean; error?: string }) => void) => {
      const { gameCode, teamName } = payload;
      const room = rooms.get(gameCode);
      if (!room) {
        callback({ success: false, error: 'Game not found. Check the code and try again.' });
        return;
      }

      const existingTeam = room.teams.get(teamName);
      if (existingTeam) {
        existingTeam.socketId = socket.id;
        socket.join(gameCode);
        callback({ success: true });
        sendTeamState(room, teamName, existingTeam);
        broadcastRoomState(room);
        return;
      }

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
        engine, currentState: initialState,
        history: [{ quarter: 0, label: 'Start', state: initialState }],
        decisions: { ...DEFAULT_DECISIONS }, hasSubmitted: false, socketId: socket.id,
      };
      room.teams.set(teamName, team);
      socket.join(gameCode);
      callback({ success: true });
      sendTeamState(room, teamName, team);
      broadcastRoomState(room);
    });

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

      const activeTeams = Array.from(room.teams.values()).filter(t => !t.currentState.isGameOver);
      const allSubmitted = activeTeams.length > 0 && activeTeams.every(t => t.hasSubmitted);
      if (allSubmitted) {
        advanceAllTeams(room);
        if (room.phase === 'playing' && room.config.advanceMode === 'timer') {
          startTimer(room);
        }
      }
    });

    socket.on('disconnect', () => {
      console.log(`[people-express] Disconnected: ${socket.id}`);
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
}
