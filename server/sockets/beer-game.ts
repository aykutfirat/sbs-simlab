import type { Namespace } from 'socket.io';

// ─── Constants ───────────────────────────────────────────────────────────────
const ROLES = ['retailer', 'wholesaler', 'distributor', 'factory'] as const;
const ROLE_LABELS: Record<string, string> = {
  retailer: 'Retailer',
  wholesaler: 'Wholesaler',
  distributor: 'Distributor',
  factory: 'Factory',
};
const HOLDING_COST = 0.5;
const BACKLOG_COST = 1.0;
const INITIAL_INVENTORY = 12;
const INITIAL_PIPELINE = 4;
const DEFAULT_WEEKS = 35;
const DEFAULT_DEMAND = { type: 'step', base: 4, step: 8, stepWeek: 5 };

// ─── Game State Store ────────────────────────────────────────────────────────
const games = new Map<string, any>();

function generateRoomCode(): string {
  let code: string;
  do {
    code = String(Math.floor(1000 + Math.random() * 9000));
  } while (games.has(code));
  return code;
}

function createTeam(teamName: string) {
  const positions: Record<string, any> = {};
  for (const role of ROLES) {
    positions[role] = {
      playerId: null,
      playerName: null,
      inventory: INITIAL_INVENTORY,
      backlog: 0,
      lastOrder: 0,
      lastShipment: 0,
      lastReceived: 0,
      incomingOrder: 0,
      cumulativeCost: 0,
      totalOrdered: 0,
      totalReceived: 0,
      submitted: false,
      currentOrder: null,
      shippingPipeline: [INITIAL_PIPELINE, INITIAL_PIPELINE],
      history: {
        inventory: [] as number[],
        backlog: [] as number[],
        orders: [] as number[],
        costs: [] as number[],
        effectiveInventory: [] as number[],
        received: [] as number[],
      },
    };
  }
  return { name: teamName, positions };
}

function getDemand(game: any, week: number): number {
  const d = game.settings.demand;
  if (d.type === 'custom' && Array.isArray(d.values)) {
    return d.values[Math.min(week - 1, d.values.length - 1)] || d.base || 4;
  }
  return week < d.stepWeek ? d.base : d.step;
}

function createGame(settings: any = {}) {
  const code = generateRoomCode();
  const game = {
    code,
    status: 'lobby',
    week: 0,
    settings: {
      totalWeeks: settings.totalWeeks || DEFAULT_WEEKS,
      demand: settings.demand || { ...DEFAULT_DEMAND },
      teamCount: settings.teamCount || 1,
    },
    teams: {} as Record<string, any>,
    players: new Map<string, any>(),
    teacherSocketId: null as string | null,
  };

  const count = game.settings.teamCount || 1;
  for (let i = 1; i <= count; i++) {
    const teamName = `Team ${i}`;
    game.teams[teamName] = createTeam(teamName);
  }

  games.set(code, game);
  return game;
}

// ─── Game Logic ──────────────────────────────────────────────────────────────

function processRound(game: any) {
  game.week++;
  const week = game.week;
  const customerDemand = getDemand(game, week);

  for (const [, team] of Object.entries(game.teams) as [string, any][]) {
    const pos = team.positions;

    for (const role of ROLES) {
      const p = pos[role];
      const received = p.shippingPipeline[0];
      p.shippingPipeline[0] = p.shippingPipeline[1];
      p.shippingPipeline[1] = 0;
      p.inventory += received;
      p.lastReceived = received;
      p.totalReceived += received;
    }

    for (let i = 0; i < ROLES.length; i++) {
      const p = pos[ROLES[i]];
      if (i === 0) {
        p.incomingOrder = customerDemand;
      } else {
        p.incomingOrder = pos[ROLES[i - 1]].currentOrder;
      }
      if (p.currentOrder === null) {
        p.currentOrder = p.incomingOrder;
      }
    }

    for (let i = 0; i < ROLES.length; i++) {
      const role = ROLES[i];
      const p = pos[role];
      const totalDemand = p.incomingOrder + p.backlog;
      const shipped = Math.min(totalDemand, p.inventory);
      p.inventory -= shipped;
      p.backlog = totalDemand - shipped;
      p.lastShipment = shipped;

      if (i > 0) {
        const downstream = ROLES[i - 1];
        pos[downstream].shippingPipeline[1] = shipped;
      }
    }

    for (let i = 0; i < ROLES.length; i++) {
      const p = pos[ROLES[i]];
      p.lastOrder = p.currentOrder;
      p.totalOrdered += p.currentOrder;
    }
    pos.factory.shippingPipeline[1] = pos.factory.currentOrder;

    for (const role of ROLES) {
      const p = pos[role];
      const holdingCost = p.inventory * HOLDING_COST;
      const backlogCost = p.backlog * BACKLOG_COST;
      p.cumulativeCost += holdingCost + backlogCost;

      p.history.inventory.push(p.inventory);
      p.history.backlog.push(p.backlog);
      p.history.orders.push(p.lastOrder);
      p.history.costs.push(p.cumulativeCost);
      p.history.effectiveInventory.push(p.inventory - p.backlog);
      p.history.received.push(p.lastReceived);
    }

    for (const role of ROLES) {
      pos[role].submitted = false;
      pos[role].currentOrder = null;
    }
  }

  if (game.week >= game.settings.totalWeeks) {
    game.status = 'finished';
  }
}

function variance(arr: number[]): number {
  if (arr.length === 0) return 0;
  const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
  return arr.reduce((sum, x) => sum + (x - mean) ** 2, 0) / arr.length;
}

function simulateOptimal(game: any): number {
  let totalCost = 0;
  const weeks = game.week;
  const inv = [INITIAL_INVENTORY, INITIAL_INVENTORY, INITIAL_INVENTORY, INITIAL_INVENTORY];
  const backlog = [0, 0, 0, 0];
  const shipPipe = ROLES.map(() => [INITIAL_PIPELINE, INITIAL_PIPELINE]);

  for (let w = 1; w <= weeks; w++) {
    const demand = getDemand(game, w);
    for (let i = 0; i < 4; i++) {
      const received = shipPipe[i][0];
      shipPipe[i][0] = shipPipe[i][1];
      shipPipe[i][1] = 0;
      inv[i] += received;

      const totalDemand = demand + backlog[i];
      const shipped = Math.min(totalDemand, inv[i]);
      inv[i] -= shipped;
      backlog[i] = totalDemand - shipped;

      if (i > 0) {
        shipPipe[i - 1][1] = shipped;
      }
      if (i === 3) {
        shipPipe[i][1] = demand;
      }
      totalCost += inv[i] * HOLDING_COST + backlog[i] * BACKLOG_COST;
    }
  }
  return Math.round(totalCost * 100) / 100;
}

function getGameSummary(game: any) {
  const summary: any = { teams: {} };
  for (const [teamName, team] of Object.entries(game.teams) as [string, any][]) {
    const teamSummary: any = { positions: {}, totalCost: 0 };

    for (const role of ROLES) {
      const p = team.positions[role];
      teamSummary.positions[role] = {
        playerName: p.playerName || role,
        cumulativeCost: p.cumulativeCost,
        avgInventory: p.history.inventory.length > 0
          ? p.history.inventory.reduce((a: number, b: number) => a + b, 0) / p.history.inventory.length
          : 0,
        avgBacklog: p.history.backlog.length > 0
          ? p.history.backlog.reduce((a: number, b: number) => a + b, 0) / p.history.backlog.length
          : 0,
        maxOrder: p.history.orders.length > 0 ? Math.max(...p.history.orders) : 0,
        orderVariance: variance(p.history.orders),
      };
      teamSummary.totalCost += p.cumulativeCost;
    }

    const demandHistory: number[] = [];
    for (let w = 1; w <= game.week; w++) {
      demandHistory.push(getDemand(game, w));
    }
    const demandVar = variance(demandHistory);
    teamSummary.bullwhipRatio = demandVar > 0
      ? (variance(team.positions.factory.history.orders) / demandVar).toFixed(2)
      : 'N/A';
    teamSummary.optimalCost = simulateOptimal(game);

    summary.teams[teamName] = teamSummary;
  }
  return summary;
}

function getGameState(game: any) {
  const teams: Record<string, any> = {};
  for (const [teamName, team] of Object.entries(game.teams) as [string, any][]) {
    teams[teamName] = { name: team.name, positions: {} };
    for (const role of ROLES) {
      const p = team.positions[role];
      teams[teamName].positions[role] = {
        playerName: p.playerName,
        playerId: p.playerId ? true : false,
        inventory: p.inventory,
        backlog: p.backlog,
        lastOrder: p.lastOrder,
        lastShipment: p.lastShipment,
        incomingOrder: p.incomingOrder,
        cumulativeCost: p.cumulativeCost,
        submitted: p.submitted,
        shippingPipeline: [...p.shippingPipeline],
        history: p.history,
      };
    }
  }
  return {
    code: game.code,
    status: game.status,
    week: game.week,
    settings: game.settings,
    teams,
    customerDemand: game.week > 0 ? getDemand(game, game.week) : getDemand(game, 1),
  };
}

function getPlayerState(game: any, teamName: string, role: string) {
  const team = game.teams[teamName];
  if (!team) return null;
  const p = team.positions[role];
  if (!p) return null;

  const roleIndex = ROLES.indexOf(role as any);
  let upstreamBacklog = 0;
  if (roleIndex < ROLES.length - 1) {
    upstreamBacklog = team.positions[ROLES[roleIndex + 1]].backlog;
  }

  const pendingOrders = p.totalOrdered - p.totalReceived
    - p.shippingPipeline[0] - p.shippingPipeline[1];

  return {
    code: game.code,
    status: game.status,
    week: game.week,
    teamName,
    role,
    roleLabel: ROLE_LABELS[role],
    inventory: p.inventory,
    backlog: p.backlog,
    incomingOrder: p.incomingOrder,
    lastOrder: p.lastOrder,
    lastShipment: p.lastShipment,
    lastReceived: p.lastReceived,
    cumulativeCost: p.cumulativeCost,
    totalOrdered: p.totalOrdered,
    totalReceived: p.totalReceived,
    upstreamBacklog: Math.max(0, upstreamBacklog),
    pendingOrders: Math.max(0, pendingOrders),
    submitted: p.submitted,
    shippingPipeline: [...p.shippingPipeline],
    history: p.history,
    customerDemand: role === 'retailer' ? getDemand(game, Math.max(1, game.week)) : undefined,
  };
}

// ─── Socket.IO Registration ─────────────────────────────────────────────────

export function registerBeerGameSockets(nsp: Namespace) {
  nsp.on('connection', (socket) => {
    console.log(`[beer-game] Connected: ${socket.id}`);

    socket.on('create-game', (settings: any, callback: any) => {
      for (const [oldCode, oldGame] of games) {
        if (oldGame.teacherSocketId === socket.id) {
          nsp.to(`game:${oldCode}`).emit('game-ended');
          for (const [sid] of oldGame.players) {
            const ps = nsp.sockets.get(sid);
            if (ps) ps.leave(`game:${oldCode}`);
          }
          socket.leave(`game:${oldCode}`);
          socket.leave(`teacher:${oldCode}`);
          games.delete(oldCode);
        }
      }

      const game = createGame(settings);
      game.teacherSocketId = socket.id;
      socket.join(`game:${game.code}`);
      socket.join(`teacher:${game.code}`);
      callback({ success: true, code: game.code, state: getGameState(game) });
    });

    socket.on('teacher-join', (code: string, callback: any) => {
      const game = games.get(code);
      if (!game) return callback({ success: false, error: 'Game not found' });
      game.teacherSocketId = socket.id;
      socket.join(`game:${game.code}`);
      socket.join(`teacher:${game.code}`);
      callback({ success: true, state: getGameState(game) });
    });

    socket.on('add-team', (code: string, callback: any) => {
      const game = games.get(code);
      if (!game) return callback({ success: false, error: 'Game not found' });
      const teamNum = Object.keys(game.teams).length + 1;
      const teamName = `Team ${teamNum}`;
      game.teams[teamName] = createTeam(teamName);
      nsp.to(`game:${code}`).emit('game-state', getGameState(game));
      callback({ success: true });
    });

    socket.on('remove-team', ({ code, teamName }: any, callback: any) => {
      const game = games.get(code);
      if (!game) return callback({ success: false, error: 'Game not found' });
      if (Object.keys(game.teams).length <= 1) {
        return callback({ success: false, error: 'Must have at least one team' });
      }
      for (const role of ROLES) {
        const p = game.teams[teamName].positions[role];
        if (p.playerId) {
          game.players.delete(p.playerId);
          const playerSocket = nsp.sockets.get(p.playerId);
          if (playerSocket) {
            playerSocket.emit('kicked', { reason: 'Team removed' });
            playerSocket.leave(`game:${code}`);
          }
        }
      }
      delete game.teams[teamName];
      nsp.to(`game:${code}`).emit('game-state', getGameState(game));
      callback({ success: true });
    });

    socket.on('join-game', ({ code, name }: any, callback: any) => {
      const game = games.get(code);
      if (!game) return callback({ success: false, error: 'Game not found' });
      if (game.status === 'finished') return callback({ success: false, error: 'Game is finished' });

      for (const [teamName, team] of Object.entries(game.teams) as [string, any][]) {
        for (const role of ROLES) {
          const pos = team.positions[role];
          if (pos.playerName === name) {
            game.players.delete(pos.playerId);
            pos.playerId = socket.id;
            game.players.set(socket.id, { name, teamName, role });
            socket.join(`game:${code}`);
            socket.emit('assigned', { teamName, role, roleLabel: ROLE_LABELS[role] });
            if (game.status === 'playing') {
              socket.emit('game-started');
              socket.emit('player-state', getPlayerState(game, teamName, role));
            }
            nsp.to(`teacher:${code}`).emit('game-state', getGameState(game));
            return callback({ success: true, waiting: false, name });
          }
        }
      }

      game.players.set(socket.id, { name, teamName: null, role: null });
      socket.join(`game:${code}`);
      nsp.to(`teacher:${code}`).emit('player-joined', { socketId: socket.id, name, unassigned: true });
      nsp.to(`teacher:${code}`).emit('game-state', getGameState(game));
      callback({ success: true, waiting: true, name });
    });

    socket.on('rejoin-game', ({ code, name, teamName, role }: any, callback: any) => {
      const game = games.get(code);
      if (!game) return callback({ success: false, error: 'Game not found' });
      const team = game.teams[teamName];
      if (!team) return callback({ success: false, error: 'Team not found' });
      const pos = team.positions[role];
      if (!pos) return callback({ success: false, error: 'Role not found' });
      if (pos.playerName !== name) {
        return callback({ success: false, error: 'Role assigned to a different player' });
      }

      if (pos.playerId && pos.playerId !== socket.id) {
        game.players.delete(pos.playerId);
      }
      pos.playerId = socket.id;
      game.players.set(socket.id, { name, teamName, role });
      socket.join(`game:${code}`);
      socket.emit('assigned', { teamName, role, roleLabel: ROLE_LABELS[role] });
      const playerState = getPlayerState(game, teamName, role);
      socket.emit('player-state', playerState);
      nsp.to(`teacher:${code}`).emit('game-state', getGameState(game));
      callback({
        success: true, reassigned: true, status: game.status,
        teamName, role, roleLabel: ROLE_LABELS[role], playerState,
      });
    });

    socket.on('assign-player', ({ code, socketId, teamName, role }: any, callback: any) => {
      const game = games.get(code);
      if (!game) return callback({ success: false, error: 'Game not found' });
      if (!game.teams[teamName]) return callback({ success: false, error: 'Team not found' });
      if (!(ROLES as readonly string[]).includes(role)) return callback({ success: false, error: 'Invalid role' });

      const team = game.teams[teamName];
      const pos = team.positions[role];

      if (pos.playerId && pos.playerId !== socketId) {
        const oldPlayer = game.players.get(pos.playerId);
        if (oldPlayer) {
          oldPlayer.teamName = null;
          oldPlayer.role = null;
          const oldSocket = nsp.sockets.get(pos.playerId);
          if (oldSocket) oldSocket.emit('unassigned');
        }
      }

      const player = game.players.get(socketId);
      if (!player) return callback({ success: false, error: 'Player not found' });

      if (player.teamName && player.role) {
        const oldTeam = game.teams[player.teamName];
        if (oldTeam) {
          oldTeam.positions[player.role].playerId = null;
          oldTeam.positions[player.role].playerName = null;
        }
      }

      pos.playerId = socketId;
      pos.playerName = player.name;
      player.teamName = teamName;
      player.role = role;

      const playerSocket = nsp.sockets.get(socketId);
      if (playerSocket) {
        playerSocket.emit('assigned', { teamName, role, roleLabel: ROLE_LABELS[role] });
        playerSocket.emit('player-state', getPlayerState(game, teamName, role));
      }

      nsp.to(`game:${code}`).emit('game-state', getGameState(game));
      callback({ success: true });
    });

    socket.on('start-game', (code: string, callback: any) => {
      const game = games.get(code);
      if (!game) return callback({ success: false, error: 'Game not found' });

      for (const [teamName, team] of Object.entries(game.teams) as [string, any][]) {
        for (const role of ROLES) {
          if (!team.positions[role].playerId) {
            return callback({
              success: false,
              error: `${teamName}: ${ROLE_LABELS[role]} is not assigned`,
            });
          }
        }
      }

      game.status = 'playing';
      game.week = 0;

      for (const team of Object.values(game.teams) as any[]) {
        for (const role of ROLES) {
          team.positions[role].incomingOrder = getDemand(game, 1);
        }
      }

      nsp.to(`game:${code}`).emit('game-started');
      nsp.to(`game:${code}`).emit('game-state', getGameState(game));

      for (const [sid, player] of game.players) {
        if (player.teamName && player.role) {
          const ps = nsp.sockets.get(sid);
          if (ps) ps.emit('player-state', getPlayerState(game, player.teamName, player.role));
        }
      }
      callback({ success: true });
    });

    socket.on('submit-order', ({ code, quantity }: any, callback: any) => {
      const game = games.get(code);
      if (!game) return callback({ success: false, error: 'Game not found' });
      if (game.status !== 'playing') return callback({ success: false, error: 'Game not in progress' });

      const player = game.players.get(socket.id);
      if (!player || !player.teamName || !player.role) {
        return callback({ success: false, error: 'Not assigned to a role' });
      }

      const qty = Math.floor(Number(quantity));
      if (isNaN(qty) || qty < 0) {
        return callback({ success: false, error: 'Order must be a non-negative integer' });
      }

      const team = game.teams[player.teamName];
      const pos = team.positions[player.role];
      pos.currentOrder = qty;
      pos.submitted = true;

      nsp.to(`teacher:${code}`).emit('game-state', getGameState(game));
      nsp.to(`teacher:${code}`).emit('order-submitted', {
        teamName: player.teamName, role: player.role, playerName: player.name,
      });
      callback({ success: true });
    });

    socket.on('advance-round', (code: string, callback: any) => {
      const game = games.get(code);
      if (!game) return callback({ success: false, error: 'Game not found' });
      if (game.status !== 'playing') return callback({ success: false, error: 'Game not in progress' });

      processRound(game);
      nsp.to(`game:${code}`).emit('game-state', getGameState(game));

      for (const [sid, player] of game.players) {
        if (player.teamName && player.role) {
          const ps = nsp.sockets.get(sid);
          if (ps) ps.emit('player-state', getPlayerState(game, player.teamName, player.role));
        }
      }

      if (game.status === 'finished') {
        const summary = getGameSummary(game);
        nsp.to(`game:${code}`).emit('game-over', summary);
      }
      callback({ success: true, week: game.week, finished: game.status === 'finished' });
    });

    socket.on('update-settings', ({ code, settings }: any, callback: any) => {
      const game = games.get(code);
      if (!game) return callback({ success: false, error: 'Game not found' });
      if (game.status !== 'lobby') return callback({ success: false, error: 'Cannot change settings during game' });
      if (settings.totalWeeks) game.settings.totalWeeks = settings.totalWeeks;
      if (settings.demand) game.settings.demand = settings.demand;
      nsp.to(`game:${code}`).emit('game-state', getGameState(game));
      callback({ success: true });
    });

    socket.on('reset-game', (code: string, callback: any) => {
      const game = games.get(code);
      if (!game) return callback({ success: false, error: 'Game not found' });
      game.status = 'lobby';
      game.week = 0;
      for (const [, team] of Object.entries(game.teams) as [string, any][]) {
        for (const role of ROLES) {
          const p = team.positions[role];
          p.inventory = INITIAL_INVENTORY;
          p.backlog = 0;
          p.lastOrder = 0;
          p.lastShipment = 0;
          p.incomingOrder = 0;
          p.cumulativeCost = 0;
          p.submitted = false;
          p.currentOrder = null;
          p.shippingPipeline = [INITIAL_PIPELINE, INITIAL_PIPELINE];
          p.lastReceived = 0;
          p.totalOrdered = 0;
          p.totalReceived = 0;
          p.history = { inventory: [], backlog: [], orders: [], costs: [], effectiveInventory: [], received: [] };
        }
      }
      nsp.to(`game:${code}`).emit('game-reset');
      nsp.to(`game:${code}`).emit('game-state', getGameState(game));
      callback({ success: true });
    });

    socket.on('end-game', (code: string, callback: any) => {
      const game = games.get(code);
      if (!game) return callback?.({ success: true });
      nsp.to(`game:${code}`).emit('game-ended');
      for (const [sid] of game.players) {
        const ps = nsp.sockets.get(sid);
        if (ps) ps.leave(`game:${code}`);
      }
      games.delete(code);
      callback?.({ success: true });
    });

    socket.on('get-summary', (code: string, callback: any) => {
      const game = games.get(code);
      if (!game) return callback({ success: false, error: 'Game not found' });
      callback({ success: true, summary: getGameSummary(game) });
    });

    socket.on('get-players', (code: string, callback: any) => {
      const game = games.get(code);
      if (!game) return callback({ success: false, error: 'Game not found' });
      const players: any[] = [];
      for (const [sid, player] of game.players) {
        players.push({
          socketId: sid, name: player.name,
          teamName: player.teamName, role: player.role,
          connected: nsp.sockets.has(sid),
        });
      }
      callback({ success: true, players });
    });

    socket.on('disconnect', () => {
      console.log(`[beer-game] Disconnected: ${socket.id}`);
      for (const [code, game] of games) {
        const player = game.players.get(socket.id);
        if (player) {
          nsp.to(`teacher:${code}`).emit('player-disconnected', {
            socketId: socket.id, name: player.name,
            teamName: player.teamName, role: player.role,
          });
          break;
        }
      }
    });
  });
}
