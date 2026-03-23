import type { Namespace, Socket } from 'socket.io';

// ── Types ────────────────────────────────────────────────────

type GamePhase = 'lobby' | 'individual' | 'team' | 'results' | 'debrief';

interface Player {
  name: string;
  teamId: string | null;
  connected: boolean;
  socketId: string | null;
  individualRanking: string[] | null;
  individualScore: number | null;
}

interface ChatMessage {
  sender: string;
  text: string;
  timestamp: number;
}

interface Team {
  id: string;
  name: string;
  members: string[];
  consensusRanking: string[] | null;
  confirmedBy: string[];
  teamScore: number | null;
  chat: ChatMessage[];
}

interface GameSettings {
  individualTimerSeconds: number;
  teamTimerSeconds: number;
  teamSize: number;
}

interface GameRoom {
  code: string;
  phase: GamePhase;
  settings: GameSettings;
  players: Record<string, Player>;
  teams: Record<string, Team>;
  instructorSocketId: string | null;
  timerRemaining: number | null;
  timerInterval: ReturnType<typeof setInterval> | null;
}

// ── NASA Data (server-side for scoring) ─────────────────────

const NASA_RANKINGS: Record<string, number> = {
  oxygen: 1, water: 2, 'star-map': 3, food: 4, 'fm-radio': 5,
  rope: 6, 'first-aid': 7, parachute: 8, 'life-raft': 9,
  'signal-flares': 10, pistols: 11, milk: 12, 'heating-unit': 13,
  compass: 14, matches: 15,
};

function calculateErrorScore(ranking: string[]): number {
  let total = 0;
  for (let i = 0; i < ranking.length; i++) {
    const nasaRank = NASA_RANKINGS[ranking[i]];
    if (nasaRank !== undefined) {
      total += Math.abs((i + 1) - nasaRank);
    }
  }
  return total;
}

// ── Room Storage ────────────────────────────────────────────

const rooms = new Map<string, GameRoom>();

function generateCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 5; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

function getUniqueCode(): string {
  let code = generateCode();
  while (rooms.has(code)) code = generateCode();
  return code;
}

// ── State Broadcasting ──────────────────────────────────────

function getPlayerState(room: GameRoom, playerName: string) {
  const player = room.players[playerName];
  if (!player) return null;
  const team = player.teamId ? room.teams[player.teamId] : null;

  const allPlayersSubmitted = Object.values(room.players).every(
    p => p.individualRanking !== null
  );
  const allTeamsConfirmed = Object.values(room.teams).every(
    t => t.members.length > 0 && t.confirmedBy.length === t.members.length
  );

  return {
    phase: room.phase,
    player: {
      name: player.name,
      teamId: player.teamId,
      connected: player.connected,
      individualRanking: player.individualRanking,
      individualScore: room.phase === 'results' || room.phase === 'debrief'
        ? player.individualScore : null,
    },
    team: team ? {
      id: team.id,
      name: team.name,
      members: team.members,
      consensusRanking: team.consensusRanking,
      confirmedBy: team.confirmedBy,
      teamScore: room.phase === 'results' || room.phase === 'debrief'
        ? team.teamScore : null,
      chat: team.chat,
    } : null,
    timerRemaining: room.timerRemaining,
    allPlayersSubmitted,
    allTeamsConfirmed,
  };
}

function getInstructorState(room: GameRoom) {
  const players: Record<string, any> = {};
  for (const [name, p] of Object.entries(room.players)) {
    players[name] = {
      name: p.name,
      teamId: p.teamId,
      connected: p.connected,
      individualRanking: p.individualRanking,
      individualScore: p.individualScore,
    };
  }

  const teams: Record<string, any> = {};
  for (const [id, t] of Object.entries(room.teams)) {
    teams[id] = {
      id: t.id,
      name: t.name,
      members: t.members,
      consensusRanking: t.consensusRanking,
      confirmedBy: t.confirmedBy,
      teamScore: t.teamScore,
      chat: t.chat,
    };
  }

  return {
    code: room.code,
    phase: room.phase,
    settings: room.settings,
    players,
    teams,
    timerRemaining: room.timerRemaining,
  };
}

function broadcastToPlayers(nsp: Namespace, room: GameRoom) {
  for (const [name, player] of Object.entries(room.players)) {
    if (player.socketId && player.connected) {
      const state = getPlayerState(room, name);
      nsp.to(player.socketId).emit('player-state', state);
    }
  }
}

function broadcastToInstructor(nsp: Namespace, room: GameRoom) {
  if (room.instructorSocketId) {
    nsp.to(room.instructorSocketId).emit('instructor-state', getInstructorState(room));
  }
}

function broadcastAll(nsp: Namespace, room: GameRoom) {
  broadcastToInstructor(nsp, room);
  broadcastToPlayers(nsp, room);
}

// ── Timer ───────────────────────────────────────────────────

function startTimer(nsp: Namespace, room: GameRoom, seconds: number) {
  clearTimer(room);
  room.timerRemaining = seconds;
  room.timerInterval = setInterval(() => {
    if (room.timerRemaining !== null && room.timerRemaining > 0) {
      room.timerRemaining--;
      broadcastAll(nsp, room);
    }
    if (room.timerRemaining !== null && room.timerRemaining <= 0) {
      clearTimer(room);
      // Auto-advance when timer expires
      if (room.phase === 'individual') {
        handleAutoSubmitIndividual(nsp, room);
      }
      broadcastAll(nsp, room);
    }
  }, 1000);
}

function clearTimer(room: GameRoom) {
  if (room.timerInterval) {
    clearInterval(room.timerInterval);
    room.timerInterval = null;
  }
  room.timerRemaining = null;
}

function handleAutoSubmitIndividual(nsp: Namespace, room: GameRoom) {
  // For players who haven't submitted, auto-submit default order
  const defaultOrder = Object.keys(NASA_RANKINGS);
  for (const player of Object.values(room.players)) {
    if (!player.individualRanking) {
      player.individualRanking = defaultOrder;
      player.individualScore = calculateErrorScore(defaultOrder);
    }
  }
}

// ── Socket Handler ──────────────────────────────────────────

export function registerMoonSurvivalSockets(nsp: Namespace) {
  nsp.on('connection', (socket: Socket) => {

    // ── Instructor: Create Game ───────────────────────────
    socket.on('create-game', (settings: Partial<GameSettings>, callback) => {
      const code = getUniqueCode();
      const room: GameRoom = {
        code,
        phase: 'lobby',
        settings: {
          individualTimerSeconds: settings.individualTimerSeconds ?? 300,
          teamTimerSeconds: settings.teamTimerSeconds ?? 600,
          teamSize: settings.teamSize ?? 4,
        },
        players: {},
        teams: {},
        instructorSocketId: socket.id,
        timerRemaining: null,
        timerInterval: null,
      };
      rooms.set(code, room);
      socket.join(`instructor:${code}`);
      callback({ success: true, code });
      broadcastToInstructor(nsp, room);
    });

    // ── Instructor: Reconnect ─────────────────────────────
    socket.on('instructor-rejoin', (code: string, callback) => {
      const room = rooms.get(code);
      if (!room) return callback({ success: false, error: 'Room not found' });
      room.instructorSocketId = socket.id;
      socket.join(`instructor:${code}`);
      callback({ success: true });
      broadcastToInstructor(nsp, room);
    });

    // ── Student: Join Game ────────────────────────────────
    socket.on('join-game', ({ code, name }: { code: string; name: string }, callback) => {
      const room = rooms.get(code.toUpperCase());
      if (!room) return callback({ success: false, error: 'Room not found' });

      const upperCode = code.toUpperCase();

      // Reconnect existing player
      if (room.players[name]) {
        room.players[name].connected = true;
        room.players[name].socketId = socket.id;
        socket.join(`game:${upperCode}`);
        callback({ success: true, code: upperCode });
        broadcastAll(nsp, room);
        return;
      }

      // New player
      if (room.phase !== 'lobby') {
        return callback({ success: false, error: 'Game already in progress' });
      }

      room.players[name] = {
        name,
        teamId: null,
        connected: true,
        socketId: socket.id,
        individualRanking: null,
        individualScore: null,
      };

      socket.join(`game:${upperCode}`);
      callback({ success: true, code: upperCode });
      broadcastAll(nsp, room);
    });

    // ── Instructor: Auto-assign Teams ─────────────────────
    socket.on('auto-assign-teams', (code: string, callback) => {
      const room = rooms.get(code);
      if (!room) return callback({ success: false, error: 'Room not found' });

      const playerNames = Object.keys(room.players);
      const teamSize = room.settings.teamSize;
      const numTeams = Math.max(1, Math.ceil(playerNames.length / teamSize));

      // Reset existing teams
      room.teams = {};
      for (const p of Object.values(room.players)) {
        p.teamId = null;
      }

      // Shuffle players
      const shuffled = [...playerNames].sort(() => Math.random() - 0.5);

      // Create teams
      const teamNames = [
        'Alpha', 'Bravo', 'Charlie', 'Delta', 'Echo',
        'Foxtrot', 'Golf', 'Hotel', 'India', 'Juliet',
      ];

      for (let i = 0; i < numTeams; i++) {
        const teamId = `team-${i + 1}`;
        room.teams[teamId] = {
          id: teamId,
          name: teamNames[i] || `Team ${i + 1}`,
          members: [],
          consensusRanking: null,
          confirmedBy: [],
          teamScore: null,
          chat: [],
        };
      }

      // Distribute players round-robin
      for (let i = 0; i < shuffled.length; i++) {
        const teamIndex = i % numTeams;
        const teamId = `team-${teamIndex + 1}`;
        room.teams[teamId].members.push(shuffled[i]);
        room.players[shuffled[i]].teamId = teamId;
      }

      callback({ success: true });
      broadcastAll(nsp, room);
    });

    // ── Instructor: Manual team assignment ────────────────
    socket.on('assign-player-team', ({ code, playerName, teamId }: { code: string; playerName: string; teamId: string }, callback) => {
      const room = rooms.get(code);
      if (!room) return callback({ success: false, error: 'Room not found' });

      const player = room.players[playerName];
      if (!player) return callback({ success: false, error: 'Player not found' });

      // Remove from old team
      if (player.teamId && room.teams[player.teamId]) {
        const oldTeam = room.teams[player.teamId];
        oldTeam.members = oldTeam.members.filter(m => m !== playerName);
      }

      // Add to new team
      player.teamId = teamId;
      if (room.teams[teamId]) {
        if (!room.teams[teamId].members.includes(playerName)) {
          room.teams[teamId].members.push(playerName);
        }
      }

      callback({ success: true });
      broadcastAll(nsp, room);
    });

    // ── Instructor: Add/Remove teams ──────────────────────
    socket.on('add-team', ({ code, teamName }: { code: string; teamName: string }, callback) => {
      const room = rooms.get(code);
      if (!room) return callback({ success: false, error: 'Room not found' });

      const teamId = `team-${Date.now()}`;
      room.teams[teamId] = {
        id: teamId,
        name: teamName,
        members: [],
        consensusRanking: null,
        confirmedBy: [],
        teamScore: null,
        chat: [],
      };

      callback({ success: true, teamId });
      broadcastAll(nsp, room);
    });

    socket.on('remove-team', ({ code, teamId }: { code: string; teamId: string }, callback) => {
      const room = rooms.get(code);
      if (!room) return callback({ success: false, error: 'Room not found' });

      const team = room.teams[teamId];
      if (team) {
        for (const memberName of team.members) {
          if (room.players[memberName]) {
            room.players[memberName].teamId = null;
          }
        }
        delete room.teams[teamId];
      }

      callback({ success: true });
      broadcastAll(nsp, room);
    });

    // ── Instructor: Update settings ───────────────────────
    socket.on('update-settings', ({ code, settings }: { code: string; settings: Partial<GameSettings> }, callback) => {
      const room = rooms.get(code);
      if (!room) return callback({ success: false, error: 'Room not found' });
      Object.assign(room.settings, settings);
      callback({ success: true });
      broadcastToInstructor(nsp, room);
    });

    // ── Instructor: Start Individual Phase ────────────────
    socket.on('start-individual', (code: string, callback) => {
      const room = rooms.get(code);
      if (!room) return callback({ success: false, error: 'Room not found' });
      if (room.phase !== 'lobby') return callback({ success: false, error: 'Invalid phase' });

      // Ensure all players are assigned to teams
      const unassigned = Object.values(room.players).filter(p => !p.teamId);
      if (unassigned.length > 0) {
        return callback({
          success: false,
          error: `${unassigned.length} player(s) not assigned to teams`,
        });
      }

      room.phase = 'individual';
      if (room.settings.individualTimerSeconds > 0) {
        startTimer(nsp, room, room.settings.individualTimerSeconds);
      }

      callback({ success: true });
      broadcastAll(nsp, room);
    });

    // ── Student: Submit Individual Ranking ─────────────────
    socket.on('submit-individual-ranking', ({ code, name, ranking }: { code: string; name: string; ranking: string[] }, callback) => {
      const room = rooms.get(code);
      if (!room) return callback({ success: false, error: 'Room not found' });
      if (room.phase !== 'individual') return callback({ success: false, error: 'Not in individual phase' });

      const player = room.players[name];
      if (!player) return callback({ success: false, error: 'Player not found' });

      if (ranking.length !== 15) return callback({ success: false, error: 'Must rank all 15 items' });

      player.individualRanking = ranking;
      player.individualScore = calculateErrorScore(ranking);

      callback({ success: true, score: player.individualScore });
      broadcastAll(nsp, room);
    });

    // ── Instructor: Start Team Phase ──────────────────────
    socket.on('start-team-phase', (code: string, callback) => {
      const room = rooms.get(code);
      if (!room) return callback({ success: false, error: 'Room not found' });
      if (room.phase !== 'individual') return callback({ success: false, error: 'Invalid phase' });

      // Auto-submit for anyone who hasn't submitted
      handleAutoSubmitIndividual(nsp, room);
      clearTimer(room);

      room.phase = 'team';

      // Initialize consensus rankings with a shuffled default
      const defaultOrder = Object.keys(NASA_RANKINGS);
      for (const team of Object.values(room.teams)) {
        if (!team.consensusRanking) {
          team.consensusRanking = [...defaultOrder];
        }
        team.confirmedBy = [];
      }

      if (room.settings.teamTimerSeconds > 0) {
        startTimer(nsp, room, room.settings.teamTimerSeconds);
      }

      callback({ success: true });
      broadcastAll(nsp, room);
    });

    // ── Student: Update Team Ranking ──────────────────────
    socket.on('update-team-ranking', ({ code, teamId, ranking }: { code: string; teamId: string; ranking: string[] }, callback) => {
      const room = rooms.get(code);
      if (!room) return callback({ success: false, error: 'Room not found' });
      if (room.phase !== 'team') return callback({ success: false, error: 'Not in team phase' });

      const team = room.teams[teamId];
      if (!team) return callback({ success: false, error: 'Team not found' });

      team.consensusRanking = ranking;
      // Reset confirmations when ranking changes
      team.confirmedBy = [];

      callback({ success: true });
      broadcastAll(nsp, room);
    });

    // ── Student: Chat Message ─────────────────────────────
    socket.on('team-chat-message', ({ code, teamId, sender, text }: { code: string; teamId: string; sender: string; text: string }) => {
      const room = rooms.get(code);
      if (!room) return;

      const team = room.teams[teamId];
      if (!team) return;

      team.chat.push({ sender, text, timestamp: Date.now() });

      // Keep last 200 messages
      if (team.chat.length > 200) {
        team.chat = team.chat.slice(-200);
      }

      broadcastAll(nsp, room);
    });

    // ── Student: Confirm Team Ranking ─────────────────────
    socket.on('confirm-team-ranking', ({ code, teamId, playerName }: { code: string; teamId: string; playerName: string }, callback) => {
      const room = rooms.get(code);
      if (!room) return callback({ success: false, error: 'Room not found' });

      const team = room.teams[teamId];
      if (!team) return callback({ success: false, error: 'Team not found' });

      if (!team.confirmedBy.includes(playerName)) {
        team.confirmedBy.push(playerName);
      }

      callback({ success: true });
      broadcastAll(nsp, room);
    });

    // ── Student: Unconfirm ────────────────────────────────
    socket.on('unconfirm-team-ranking', ({ code, teamId, playerName }: { code: string; teamId: string; playerName: string }, callback) => {
      const room = rooms.get(code);
      if (!room) return callback({ success: false, error: 'Room not found' });

      const team = room.teams[teamId];
      if (!team) return callback({ success: false, error: 'Team not found' });

      team.confirmedBy = team.confirmedBy.filter(n => n !== playerName);

      callback({ success: true });
      broadcastAll(nsp, room);
    });

    // ── Instructor: Reveal Results ────────────────────────
    socket.on('reveal-results', (code: string, callback) => {
      const room = rooms.get(code);
      if (!room) return callback({ success: false, error: 'Room not found' });
      if (room.phase !== 'team') return callback({ success: false, error: 'Invalid phase' });

      clearTimer(room);

      // Calculate team scores
      for (const team of Object.values(room.teams)) {
        if (team.consensusRanking && team.consensusRanking.length === 15) {
          team.teamScore = calculateErrorScore(team.consensusRanking);
        }
      }

      room.phase = 'results';
      callback({ success: true });
      broadcastAll(nsp, room);
    });

    // ── Instructor: Move to Debrief ───────────────────────
    socket.on('start-debrief', (code: string, callback) => {
      const room = rooms.get(code);
      if (!room) return callback({ success: false, error: 'Room not found' });

      room.phase = 'debrief';
      callback({ success: true });
      broadcastAll(nsp, room);
    });

    // ── Instructor: Get full results for debrief ──────────
    socket.on('get-results', (code: string, callback) => {
      const room = rooms.get(code);
      if (!room) return callback({ success: false, error: 'Room not found' });

      const players: Record<string, any> = {};
      for (const [name, p] of Object.entries(room.players)) {
        players[name] = {
          name: p.name,
          teamId: p.teamId,
          individualScore: p.individualScore,
          individualRanking: p.individualRanking,
        };
      }

      const teams: Record<string, any> = {};
      for (const [id, t] of Object.entries(room.teams)) {
        const memberScores = t.members
          .map(m => room.players[m]?.individualScore)
          .filter((s): s is number => s !== null);

        const bestIndividualScore = memberScores.length > 0 ? Math.min(...memberScores) : 0;
        const averageIndividualScore = memberScores.length > 0
          ? Math.round((memberScores.reduce((a, b) => a + b, 0) / memberScores.length) * 10) / 10
          : 0;

        teams[id] = {
          id: t.id,
          name: t.name,
          members: t.members,
          teamScore: t.teamScore,
          consensusRanking: t.consensusRanking,
          bestIndividualScore,
          averageIndividualScore,
          synergy: bestIndividualScore - (t.teamScore ?? 0),
        };
      }

      callback({ success: true, results: { players, teams } });
    });

    // ── Instructor: Reset to Lobby ────────────────────────
    socket.on('reset-game', (code: string, callback) => {
      const room = rooms.get(code);
      if (!room) return callback({ success: false, error: 'Room not found' });

      clearTimer(room);
      room.phase = 'lobby';

      for (const p of Object.values(room.players)) {
        p.individualRanking = null;
        p.individualScore = null;
      }

      for (const t of Object.values(room.teams)) {
        t.consensusRanking = null;
        t.confirmedBy = [];
        t.teamScore = null;
        t.chat = [];
      }

      callback({ success: true });
      broadcastAll(nsp, room);
    });

    // ── Instructor: Remove Player ─────────────────────────
    socket.on('remove-player', ({ code, playerName }: { code: string; playerName: string }, callback) => {
      const room = rooms.get(code);
      if (!room) return callback({ success: false, error: 'Room not found' });

      const player = room.players[playerName];
      if (!player) return callback({ success: false, error: 'Player not found' });

      // Remove from team
      if (player.teamId && room.teams[player.teamId]) {
        const team = room.teams[player.teamId];
        team.members = team.members.filter(m => m !== playerName);
        team.confirmedBy = team.confirmedBy.filter(n => n !== playerName);
      }

      // Disconnect player socket
      if (player.socketId) {
        nsp.to(player.socketId).emit('kicked');
      }

      delete room.players[playerName];
      callback({ success: true });
      broadcastAll(nsp, room);
    });

    // ── Disconnect ────────────────────────────────────────
    socket.on('disconnect', () => {
      for (const room of rooms.values()) {
        // Check if instructor disconnected
        if (room.instructorSocketId === socket.id) {
          room.instructorSocketId = null;
        }

        // Check if a player disconnected
        for (const player of Object.values(room.players)) {
          if (player.socketId === socket.id) {
            player.connected = false;
            player.socketId = null;
            broadcastToInstructor(nsp, room);
            break;
          }
        }
      }
    });
  });
}
