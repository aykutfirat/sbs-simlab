import type { Namespace, Socket } from 'socket.io';

// ── Types (duplicated from client to avoid cross-project imports) ───

type GamePhase = 'lobby' | 'playing' | 'round-results' | 'debrief';
type InfoMode = 'fog' | 'full' | 'dark';
type AIStrategy = 'nash' | 'predator' | 'tit-for-tat' | 'random';

interface Decisions { price: number; qualityInvestment: number; marketingSpend: number; }

interface RoundRecord {
  round: number; price: number; qualityInvestment: number; marketingSpend: number;
  quality: number; brand: number; customers: number; marketShare: number;
  revenue: number; variableCost: number; fixedCost: number; qualityCost: number;
  marketingCost: number; totalCost: number; profit: number; cumulativeProfit: number;
  marketSize: number;
}

interface FirmState {
  id: string; name: string; icon: string; isAI: boolean; aiStrategy?: AIStrategy;
  price: number; quality: number; brand: number; customers: number; marketShare: number;
  revenue: number; profit: number; cumulativeProfit: number; bankrupt: boolean;
  decisions: Decisions | null; history: RoundRecord[]; members: string[];
  connected: boolean; socketId: string | null;
}

interface MarketEvent {
  type: string; name: string; description: string; roundTriggered: number; duration: number;
}

interface ActiveEvent { event: MarketEvent; remainingRounds: number; }

interface AIBotConfig { strategy: AIStrategy; firmName: string; }

interface GameConfig {
  totalRounds: number; teamCount: number; timerSeconds: number;
  infoMode: InfoMode; enableEvents: boolean; aiBots: AIBotConfig[];
}

interface GameRoom {
  code: string; phase: GamePhase; config: GameConfig; round: number;
  firms: Record<string, FirmState>; marketSize: number; events: ActiveEvent[];
  eventLog: MarketEvent[]; scheduledEvents: MarketEvent[];
  instructorSocketId: string | null;
  timerRemaining: number | null; timerInterval: ReturnType<typeof setInterval> | null;
  infoMode: InfoMode;
}

// ── Constants ───────────────────────────────────────────────

const MARGINAL_COST = 5;
const FIXED_COST = 15000;
const MIN_PRICE = 8;
const MAX_PRICE = 30;
const DEFAULT_PRICE = 18;
const DEFAULT_QUALITY = 50;
const DEFAULT_BRAND = 0.5;
const BASE_MARKET_SIZE = 10000;
const MARKET_GROWTH_RATE = 0.02;
const BANKRUPTCY_THRESHOLD = -100000;
const ALPHA = 0.03;
const BETA = 2.0;
const GAMMA = 0.15;
const NOISE_RANGE = 0.1;
const QUALITY_DECAY = 0.97;
const QUALITY_INVEST_FACTOR = 0.005;
const MAX_QUALITY = 100;
const BRAND_DECAY = 0.95;
const MARKETING_FACTOR = 0.00005;
const WORD_OF_MOUTH_FACTOR = 0.02;
const MAX_BRAND = 1;

const FIRM_ICONS = ['🚀', '⚡', '🛡️', '💎', '🔥', '🌊', '⭐', '🎯'];
const FIRM_NAMES = [
  'Nova Cloud', 'Apex Data', 'Cirrus Tech', 'Zenith IO',
  'Pulse Storage', 'Drift Systems', 'Orbit Labs', 'Flux Networks',
];

// ── Room Storage ────────────────────────────────────────────

const rooms = new Map<string, GameRoom>();

function generateCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 5; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

function getUniqueCode(): string {
  let code = generateCode();
  while (rooms.has(code)) code = generateCode();
  return code;
}

// ── Market Engine (server-side) ─────────────────────────────

function resolveRound(room: GameRoom): void {
  const { firms } = room;
  room.round++;

  // Grow market
  room.marketSize = Math.round(room.marketSize * (1 + MARKET_GROWTH_RATE));

  // Check for scheduled events
  for (const se of room.scheduledEvents) {
    if (se.roundTriggered === room.round) {
      room.events.push({ event: { ...se }, remainingRounds: se.duration });
      room.eventLog.push({ ...se, roundTriggered: room.round });
    }
  }

  // Apply event effects to market
  let marketSize = room.marketSize;
  let priceSensitivityMultiplier = 1;
  let tempInfoMode: InfoMode | null = null;

  for (const ae of room.events) {
    if (ae.event.type === 'recession') marketSize = Math.round(marketSize * 0.80);
    if (ae.event.type === 'new-entrant-rumor') priceSensitivityMultiplier = 1.3;
    if (ae.event.type === 'price-transparency') tempInfoMode = 'full';
  }

  if (tempInfoMode) room.infoMode = tempInfoMode;

  const activeFirms = Object.values(firms).filter(f => !f.bankrupt);
  if (activeFirms.length === 0) return;

  // Generate AI decisions
  for (const firm of activeFirms) {
    if (firm.isAI && firm.aiStrategy && !firm.decisions) {
      firm.decisions = getAIDecisions(firm.aiStrategy, firm, activeFirms, room.round, activeFirms.length);
    }
    // Default decisions for teams that didn't submit
    if (!firm.decisions) {
      firm.decisions = { price: firm.price, qualityInvestment: 0, marketingSpend: 0 };
    }
  }

  // Apply decisions: update quality and brand
  for (const firm of activeFirms) {
    const d = firm.decisions!;
    firm.price = d.price;

    // Quality dynamics
    firm.quality = firm.quality * QUALITY_DECAY + d.qualityInvestment * QUALITY_INVEST_FACTOR;
    firm.quality = Math.max(0, Math.min(MAX_QUALITY, firm.quality));

    // Brand dynamics
    const wordOfMouth = WORD_OF_MOUTH_FACTOR * firm.marketShare * (firm.quality / MAX_QUALITY);
    firm.brand = firm.brand * BRAND_DECAY + d.marketingSpend * MARKETING_FACTOR + wordOfMouth;
    firm.brand = Math.max(0, Math.min(MAX_BRAND, firm.brand));
  }

  // Apply one-time event effects
  for (const ae of room.events) {
    if (ae.remainingRounds === ae.event.duration) {
      if (ae.event.type === 'tech-breakthrough') {
        const idx = Math.floor(Math.random() * activeFirms.length);
        activeFirms[idx].quality = Math.min(MAX_QUALITY, activeFirms[idx].quality + 15);
      }
      if (ae.event.type === 'viral-review') {
        const best = activeFirms.reduce((a, b) => a.quality > b.quality ? a : b);
        best.brand = Math.min(MAX_BRAND, best.brand + 0.2);
      }
      if (ae.event.type === 'data-breach') {
        const worstQI = activeFirms.reduce((a, b) =>
          (a.decisions?.qualityInvestment ?? 0) < (b.decisions?.qualityInvestment ?? 0) ? a : b
        );
        worstQI.brand = Math.max(0, worstQI.brand - 0.15);
      }
    }
  }

  // Logit demand model
  const utilities = new Map<string, number>();
  let sumExp = 0;
  for (const firm of activeFirms) {
    const noise = (Math.random() - 0.5) * 2 * NOISE_RANGE;
    const u = ALPHA * firm.quality + BETA * firm.brand - GAMMA * priceSensitivityMultiplier * firm.price + noise;
    utilities.set(firm.id, u);
    sumExp += Math.exp(u);
  }

  for (const firm of activeFirms) {
    const u = utilities.get(firm.id)!;
    firm.marketShare = Math.exp(u) / sumExp;
    firm.customers = Math.round(marketSize * firm.marketShare);
  }

  // Financials
  for (const firm of activeFirms) {
    const d = firm.decisions!;
    firm.revenue = firm.customers * firm.price;
    const variableCost = firm.customers * MARGINAL_COST;
    const qualityCost = d.qualityInvestment;
    const marketingCost = d.marketingSpend;
    const totalCost = FIXED_COST + variableCost + qualityCost + marketingCost;
    firm.profit = firm.revenue - totalCost;
    firm.cumulativeProfit += firm.profit;

    firm.history.push({
      round: room.round,
      price: firm.price,
      qualityInvestment: d.qualityInvestment,
      marketingSpend: d.marketingSpend,
      quality: firm.quality,
      brand: firm.brand,
      customers: firm.customers,
      marketShare: firm.marketShare,
      revenue: firm.revenue,
      variableCost,
      fixedCost: FIXED_COST,
      qualityCost,
      marketingCost,
      totalCost,
      profit: firm.profit,
      cumulativeProfit: firm.cumulativeProfit,
      marketSize,
    });

    firm.decisions = null;

    if (firm.cumulativeProfit < BANKRUPTCY_THRESHOLD) {
      firm.bankrupt = true;
    }
  }

  // Tick down events
  room.events = room.events
    .map(ae => ({ ...ae, remainingRounds: ae.remainingRounds - 1 }))
    .filter(ae => ae.remainingRounds > 0);

  // Restore info mode if price transparency expired
  if (tempInfoMode && !room.events.some(ae => ae.event.type === 'price-transparency')) {
    room.infoMode = room.config.infoMode;
  }
}

// ── AI Strategies ───────────────────────────────────────────

function getAIDecisions(
  strategy: AIStrategy, firm: FirmState, allFirms: FirmState[],
  round: number, totalFirms: number,
): Decisions {
  switch (strategy) {
    case 'nash': return nashBot(totalFirms);
    case 'predator': return predatorBot(firm, allFirms);
    case 'tit-for-tat': return titForTatBot(firm, allFirms, round);
    case 'random': return randomBot();
  }
}

function nashBot(totalFirms: number): Decisions {
  const markup = 1 / (GAMMA * (1 - 1 / Math.max(totalFirms, 2)));
  const p = Math.max(MIN_PRICE, Math.min(MAX_PRICE, MARGINAL_COST + markup));
  return { price: Math.round(p * 100) / 100, qualityInvestment: 3000, marketingSpend: 2000 };
}

function predatorBot(firm: FirmState, allFirms: FirmState[]): Decisions {
  const others = allFirms.filter(f => f.id !== firm.id && !f.bankrupt).map(f => f.price);
  let target = DEFAULT_PRICE;
  if (others.length > 0) {
    target = Math.min(...others) - 1;
    if (firm.marketShare > 0.4 && firm.history.length > 3) target = firm.price + 2;
  }
  return { price: Math.max(MIN_PRICE, Math.min(MAX_PRICE, target)), qualityInvestment: 1000, marketingSpend: 1500 };
}

function titForTatBot(firm: FirmState, allFirms: FirmState[], round: number): Decisions {
  let target = 22;
  if (round > 1) {
    const others = allFirms.filter(f => f.id !== firm.id && !f.bankrupt).map(f => f.price);
    if (others.length > 0) target = others.reduce((a, b) => a + b, 0) / others.length;
  }
  return { price: Math.max(MIN_PRICE, Math.min(MAX_PRICE, Math.round(target * 100) / 100)), qualityInvestment: 2500, marketingSpend: 2500 };
}

function randomBot(): Decisions {
  return {
    price: Math.round((12 + Math.random() * 12) * 100) / 100,
    qualityInvestment: Math.round(Math.random() * 10000),
    marketingSpend: Math.round(Math.random() * 10000),
  };
}

// ── Event scheduling ────────────────────────────────────────

const EVENT_TEMPLATES: MarketEvent[] = [
  { type: 'new-entrant-rumor', name: 'New Entrant Rumor', description: 'Customers become 30% more price-sensitive for 2 rounds.', roundTriggered: 0, duration: 2 },
  { type: 'tech-breakthrough', name: 'Tech Breakthrough', description: 'One random firm receives +15 quality for free!', roundTriggered: 0, duration: 1 },
  { type: 'recession', name: 'Recession', description: 'Total market demand shrinks by 20% for 3 rounds.', roundTriggered: 0, duration: 3 },
  { type: 'viral-review', name: 'Viral Review', description: 'Highest quality firm gets +0.2 brand awareness.', roundTriggered: 0, duration: 1 },
  { type: 'data-breach', name: 'Data Breach', description: 'Lowest quality investor loses 0.15 brand awareness.', roundTriggered: 0, duration: 1 },
  { type: 'price-transparency', name: 'Price Transparency Law', description: 'All prices visible before decisions for 1 round.', roundTriggered: 0, duration: 1 },
];

function scheduleEvents(totalRounds: number): MarketEvent[] {
  if (totalRounds < 8) return [];
  const count = totalRounds >= 16 ? 3 : 2;
  const pool = [...EVENT_TEMPLATES];
  const selected: MarketEvent[] = [];
  const start = Math.floor(totalRounds * 0.2);
  const end = Math.floor(totalRounds * 0.8);
  const spacing = Math.floor((end - start) / count);

  for (let i = 0; i < count && pool.length > 0; i++) {
    const idx = Math.floor(Math.random() * pool.length);
    const ev = { ...pool[idx], roundTriggered: start + i * spacing + Math.floor(Math.random() * 2) };
    selected.push(ev);
    pool.splice(idx, 1);
  }
  return selected;
}

// ── State Broadcasting ──────────────────────────────────────

function getTeamState(room: GameRoom, firmId: string) {
  const firm = room.firms[firmId];
  if (!firm) return null;

  const competitors = Object.values(room.firms)
    .filter(f => f.id !== firmId)
    .map(f => {
      const info: any = { id: f.id, name: f.name, icon: f.icon, bankrupt: f.bankrupt };

      if (room.infoMode === 'full') {
        info.price = f.price;
        info.quality = f.quality;
        info.brand = f.brand;
        info.customers = f.customers;
        info.marketShare = f.marketShare;
        info.profit = f.profit;
        info.cumulativeProfit = f.cumulativeProfit;
      } else if (room.infoMode === 'fog') {
        // Show previous round's price (1-round delay)
        if (f.history.length >= 1) {
          info.price = f.history[f.history.length - 1].price;
          info.marketShare = f.history[f.history.length - 1].marketShare;
        }
      }
      // 'dark' mode: no competitor info beyond name/bankrupt

      return info;
    });

  const allSubmitted = Object.values(room.firms)
    .filter(f => !f.bankrupt)
    .every(f => f.isAI || f.decisions !== null);

  return {
    phase: room.phase,
    round: room.round,
    totalRounds: room.config.totalRounds,
    firm: {
      ...firm,
      // Don't leak AI strategy to students
      aiStrategy: undefined,
      socketId: undefined,
    },
    competitors,
    marketSize: room.marketSize,
    events: room.events,
    timerRemaining: room.timerRemaining,
    allSubmitted,
    infoMode: room.infoMode,
  };
}

function getInstructorState(room: GameRoom) {
  const firms: Record<string, any> = {};
  for (const [id, f] of Object.entries(room.firms)) {
    firms[id] = { ...f, socketId: undefined };
  }
  return {
    code: room.code,
    phase: room.phase,
    round: room.round,
    config: room.config,
    firms,
    marketSize: room.marketSize,
    events: room.events,
    eventLog: room.eventLog,
    timerRemaining: room.timerRemaining,
    infoMode: room.infoMode,
  };
}

function broadcastToTeams(nsp: Namespace, room: GameRoom) {
  for (const [id, firm] of Object.entries(room.firms)) {
    if (!firm.isAI && firm.socketId && firm.connected) {
      nsp.to(firm.socketId).emit('team-state', getTeamState(room, id));
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
  broadcastToTeams(nsp, room);
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
      // Auto-resolve round when timer expires
      if (room.phase === 'playing') {
        doResolveRound(nsp, room);
      }
    }
  }, 1000);
}

function clearTimer(room: GameRoom) {
  if (room.timerInterval) { clearInterval(room.timerInterval); room.timerInterval = null; }
  room.timerRemaining = null;
}

function doResolveRound(nsp: Namespace, room: GameRoom) {
  clearTimer(room);
  resolveRound(room);
  room.phase = 'round-results';
  broadcastAll(nsp, room);
}

// ── Nash equilibrium for debrief ────────────────────────────

function computeNashEquilibrium(firmCount: number): number {
  const markup = 1 / (GAMMA * (1 - 1 / Math.max(firmCount, 2)));
  return Math.round(Math.max(MIN_PRICE, Math.min(MAX_PRICE, MARGINAL_COST + markup)) * 100) / 100;
}

// ── Socket Handler ──────────────────────────────────────────

export function registerPricingWarSockets(nsp: Namespace) {
  nsp.on('connection', (socket: Socket) => {

    // ── Instructor: Create Game ─────────────────────────
    socket.on('create-game', (config: Partial<GameConfig>, callback) => {
      const code = getUniqueCode();

      const gameConfig: GameConfig = {
        totalRounds: config.totalRounds ?? 16,
        teamCount: config.teamCount ?? 4,
        timerSeconds: config.timerSeconds ?? 0,
        infoMode: (config.infoMode as InfoMode) ?? 'fog',
        enableEvents: config.enableEvents ?? true,
        aiBots: config.aiBots ?? [],
      };

      const room: GameRoom = {
        code,
        phase: 'lobby',
        config: gameConfig,
        round: 0,
        firms: {},
        marketSize: BASE_MARKET_SIZE,
        events: [],
        eventLog: [],
        scheduledEvents: gameConfig.enableEvents ? scheduleEvents(gameConfig.totalRounds) : [],
        instructorSocketId: socket.id,
        timerRemaining: null,
        timerInterval: null,
        infoMode: gameConfig.infoMode,
      };

      // Create AI bot firms
      for (let i = 0; i < gameConfig.aiBots.length; i++) {
        const bot = gameConfig.aiBots[i];
        const firmId = `ai-${i}`;
        room.firms[firmId] = createFirm(firmId, bot.firmName || FIRM_NAMES[i], FIRM_ICONS[i], true, bot.strategy);
      }

      rooms.set(code, room);
      socket.join(`instructor:${code}`);
      callback({ success: true, code });
      broadcastToInstructor(nsp, room);
    });

    // ── Instructor: Reconnect ───────────────────────────
    socket.on('instructor-rejoin', (code: string, callback) => {
      const room = rooms.get(code);
      if (!room) return callback({ success: false, error: 'Room not found' });
      room.instructorSocketId = socket.id;
      socket.join(`instructor:${code}`);
      callback({ success: true });
      broadcastToInstructor(nsp, room);
    });

    // ── Team: Join Game ─────────────────────────────────
    socket.on('join-game', ({ code, teamName, playerName }: { code: string; teamName: string; playerName: string }, callback) => {
      const room = rooms.get(code.toUpperCase());
      if (!room) return callback({ success: false, error: 'Room not found' });
      const upperCode = code.toUpperCase();

      // Find existing firm for this team
      const existingFirm = Object.values(room.firms).find(f => f.name === teamName && !f.isAI);
      if (existingFirm) {
        // Add player to existing team or reconnect
        if (!existingFirm.members.includes(playerName)) {
          existingFirm.members.push(playerName);
        }
        existingFirm.connected = true;
        existingFirm.socketId = socket.id;
        socket.join(`game:${upperCode}`);
        callback({ success: true, code: upperCode, firmId: existingFirm.id });
        broadcastAll(nsp, room);
        return;
      }

      // New team
      if (room.phase !== 'lobby') {
        return callback({ success: false, error: 'Game already in progress' });
      }

      const humanFirms = Object.values(room.firms).filter(f => !f.isAI);
      if (humanFirms.length >= room.config.teamCount) {
        return callback({ success: false, error: 'Game is full' });
      }

      const firmId = `team-${Date.now()}`;
      const firmIndex = Object.keys(room.firms).length;
      room.firms[firmId] = createFirm(firmId, teamName, FIRM_ICONS[firmIndex % FIRM_ICONS.length], false);
      room.firms[firmId].members = [playerName];
      room.firms[firmId].connected = true;
      room.firms[firmId].socketId = socket.id;

      socket.join(`game:${upperCode}`);
      callback({ success: true, code: upperCode, firmId });
      broadcastAll(nsp, room);
    });

    // ── Team: Submit Decisions ───────────────────────────
    socket.on('submit-decisions', ({ code, firmId, decisions }: { code: string; firmId: string; decisions: Decisions }, callback) => {
      const room = rooms.get(code);
      if (!room) return callback({ success: false, error: 'Room not found' });
      if (room.phase !== 'playing') return callback({ success: false, error: 'Not in playing phase' });

      const firm = room.firms[firmId];
      if (!firm || firm.bankrupt) return callback({ success: false, error: 'Firm not found or bankrupt' });

      // Clamp values
      firm.decisions = {
        price: Math.max(MIN_PRICE, Math.min(MAX_PRICE, decisions.price)),
        qualityInvestment: Math.max(0, Math.min(10000, decisions.qualityInvestment)),
        marketingSpend: Math.max(0, Math.min(10000, decisions.marketingSpend)),
      };

      callback({ success: true });
      broadcastAll(nsp, room);

      // Check if all firms have submitted
      const allSubmitted = Object.values(room.firms)
        .filter(f => !f.bankrupt)
        .every(f => f.isAI || f.decisions !== null);

      if (allSubmitted && room.config.timerSeconds === 0) {
        // Auto-resolve if manual mode and all submitted
        // (with timer, we wait for instructor or timer)
      }
    });

    // ── Instructor: Start Game ──────────────────────────
    socket.on('start-game', (code: string, callback) => {
      const room = rooms.get(code);
      if (!room) return callback({ success: false, error: 'Room not found' });
      if (room.phase !== 'lobby') return callback({ success: false, error: 'Game already started' });

      const humanFirms = Object.values(room.firms).filter(f => !f.isAI);
      if (humanFirms.length === 0) return callback({ success: false, error: 'No teams have joined' });

      room.phase = 'playing';

      if (room.config.timerSeconds > 0) {
        startTimer(nsp, room, room.config.timerSeconds);
      }

      callback({ success: true });
      broadcastAll(nsp, room);
    });

    // ── Instructor: Advance Round (resolve + start next) ─
    socket.on('advance-round', (code: string, callback) => {
      const room = rooms.get(code);
      if (!room) return callback({ success: false, error: 'Room not found' });

      if (room.phase === 'playing') {
        // Resolve current round
        doResolveRound(nsp, room);
        callback({ success: true });
      } else if (room.phase === 'round-results') {
        // Check if game is over
        if (room.round >= room.config.totalRounds) {
          room.phase = 'debrief';
          broadcastAll(nsp, room);
          callback({ success: true });
          return;
        }

        // Start next round
        room.phase = 'playing';
        if (room.config.timerSeconds > 0) {
          startTimer(nsp, room, room.config.timerSeconds);
        }
        broadcastAll(nsp, room);
        callback({ success: true });
      } else {
        callback({ success: false, error: 'Invalid phase for advance' });
      }
    });

    // ── Instructor: Trigger Event ───────────────────────
    socket.on('trigger-event', ({ code, eventType }: { code: string; eventType: string }, callback) => {
      const room = rooms.get(code);
      if (!room) return callback({ success: false, error: 'Room not found' });

      const template = EVENT_TEMPLATES.find(e => e.type === eventType);
      if (!template) return callback({ success: false, error: 'Unknown event type' });

      const event: MarketEvent = { ...template, roundTriggered: room.round };
      room.events.push({ event, remainingRounds: event.duration });
      room.eventLog.push(event);

      callback({ success: true });
      broadcastAll(nsp, room);
    });

    // ── Instructor: Change Info Mode ────────────────────
    socket.on('change-info-mode', ({ code, mode }: { code: string; mode: InfoMode }, callback) => {
      const room = rooms.get(code);
      if (!room) return callback({ success: false, error: 'Room not found' });
      room.infoMode = mode;
      room.config.infoMode = mode;
      callback({ success: true });
      broadcastAll(nsp, room);
    });

    // ── Instructor: Update Config ───────────────────────
    socket.on('update-config', ({ code, config }: { code: string; config: Partial<GameConfig> }, callback) => {
      const room = rooms.get(code);
      if (!room) return callback({ success: false, error: 'Room not found' });
      Object.assign(room.config, config);
      if (config.infoMode) room.infoMode = config.infoMode;
      callback({ success: true });
      broadcastToInstructor(nsp, room);
    });

    // ── Instructor: End Game / Start Debrief ────────────
    socket.on('end-game', (code: string, callback) => {
      const room = rooms.get(code);
      if (!room) return callback({ success: false, error: 'Room not found' });
      clearTimer(room);
      room.phase = 'debrief';
      callback({ success: true });
      broadcastAll(nsp, room);
    });

    // ── Get Debrief Data ────────────────────────────────
    socket.on('get-debrief', (code: string, callback) => {
      const room = rooms.get(code);
      if (!room) return callback({ success: false, error: 'Room not found' });

      const firmCount = Object.values(room.firms).filter(f => !f.bankrupt).length || Object.keys(room.firms).length;
      const nashPrice = computeNashEquilibrium(firmCount);

      // Cooperative price (all firms at same high price)
      const cooperativePrice = 22;
      const coopShare = 1 / firmCount;
      const coopCustomers = BASE_MARKET_SIZE * coopShare;
      const cooperativeProfit = (coopCustomers * cooperativePrice) - FIXED_COST - (coopCustomers * MARGINAL_COST) - 3000 - 2000;

      const actualIndustryProfit = Object.values(room.firms)
        .reduce((sum, f) => sum + f.cumulativeProfit, 0);

      const cooperativeTotalProfit = cooperativeProfit * firmCount * room.round;

      const firms: Record<string, any> = {};
      for (const [id, f] of Object.entries(room.firms)) {
        firms[id] = { ...f, socketId: undefined };
      }

      callback({
        success: true,
        debrief: {
          firms,
          config: room.config,
          totalRounds: room.round,
          marketSize: room.marketSize,
          eventLog: room.eventLog,
          nashEquilibriumPrice: nashPrice,
          cooperativePrice,
          cooperativeProfit: cooperativeTotalProfit,
          actualIndustryProfit,
          competitionCost: cooperativeTotalProfit - actualIndustryProfit,
        },
      });
    });

    // ── Instructor: Remove Team ─────────────────────────
    socket.on('remove-team', ({ code, firmId }: { code: string; firmId: string }, callback) => {
      const room = rooms.get(code);
      if (!room) return callback({ success: false, error: 'Room not found' });
      const firm = room.firms[firmId];
      if (firm && firm.socketId) nsp.to(firm.socketId).emit('kicked');
      delete room.firms[firmId];
      callback({ success: true });
      broadcastAll(nsp, room);
    });

    // ── Instructor: Reset Game ──────────────────────────
    socket.on('reset-game', (code: string, callback) => {
      const room = rooms.get(code);
      if (!room) return callback({ success: false, error: 'Room not found' });
      clearTimer(room);
      room.phase = 'lobby';
      room.round = 0;
      room.marketSize = BASE_MARKET_SIZE;
      room.events = [];
      room.eventLog = [];
      room.scheduledEvents = room.config.enableEvents ? scheduleEvents(room.config.totalRounds) : [];
      room.infoMode = room.config.infoMode;

      for (const firm of Object.values(room.firms)) {
        firm.price = DEFAULT_PRICE;
        firm.quality = DEFAULT_QUALITY;
        firm.brand = DEFAULT_BRAND;
        firm.customers = 0;
        firm.marketShare = 0;
        firm.revenue = 0;
        firm.profit = 0;
        firm.cumulativeProfit = 0;
        firm.bankrupt = false;
        firm.decisions = null;
        firm.history = [];
      }

      callback({ success: true });
      broadcastAll(nsp, room);
    });

    // ── Disconnect ──────────────────────────────────────
    socket.on('disconnect', () => {
      for (const room of rooms.values()) {
        if (room.instructorSocketId === socket.id) room.instructorSocketId = null;
        for (const firm of Object.values(room.firms)) {
          if (firm.socketId === socket.id) {
            firm.connected = false;
            firm.socketId = null;
            broadcastToInstructor(nsp, room);
            break;
          }
        }
      }
    });
  });
}

function createFirm(id: string, name: string, icon: string, isAI: boolean, aiStrategy?: AIStrategy): FirmState {
  return {
    id, name, icon, isAI, aiStrategy,
    price: DEFAULT_PRICE, quality: DEFAULT_QUALITY, brand: DEFAULT_BRAND,
    customers: 0, marketShare: 0, revenue: 0, profit: 0, cumulativeProfit: 0,
    bankrupt: false, decisions: null, history: [], members: [],
    connected: false, socketId: null,
  };
}
