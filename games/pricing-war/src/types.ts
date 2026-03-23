export type GamePhase = 'lobby' | 'playing' | 'round-results' | 'debrief';
export type InfoMode = 'fog' | 'full' | 'dark';
export type AIStrategy = 'nash' | 'predator' | 'tit-for-tat' | 'random';

export interface GameConfig {
  totalRounds: number;
  teamCount: number;
  timerSeconds: number; // 0 = no timer (manual advance)
  infoMode: InfoMode;
  enableEvents: boolean;
  aiBots: AIBotConfig[];
}

export interface AIBotConfig {
  strategy: AIStrategy;
  firmName: string;
}

export interface Decisions {
  price: number;
  qualityInvestment: number;
  marketingSpend: number;
}

export interface FirmState {
  id: string;
  name: string;
  icon: string;
  isAI: boolean;
  aiStrategy?: AIStrategy;
  price: number;
  quality: number;
  brand: number;
  customers: number;
  marketShare: number;
  revenue: number;
  profit: number;
  cumulativeProfit: number;
  bankrupt: boolean;
  decisions: Decisions | null; // current round pending decisions
  history: RoundRecord[];
  members: string[]; // player names in this team
  connected: boolean;
  socketId: string | null;
}

export interface RoundRecord {
  round: number;
  price: number;
  qualityInvestment: number;
  marketingSpend: number;
  quality: number;
  brand: number;
  customers: number;
  marketShare: number;
  revenue: number;
  variableCost: number;
  fixedCost: number;
  qualityCost: number;
  marketingCost: number;
  totalCost: number;
  profit: number;
  cumulativeProfit: number;
  marketSize: number;
}

export interface MarketEvent {
  type: string;
  name: string;
  description: string;
  roundTriggered: number;
  duration: number; // rounds
}

export interface ActiveEvent {
  event: MarketEvent;
  remainingRounds: number;
}

export interface GameRoom {
  code: string;
  phase: GamePhase;
  config: GameConfig;
  round: number;
  firms: Record<string, FirmState>;
  marketSize: number;
  events: ActiveEvent[];
  eventLog: MarketEvent[];
  instructorSocketId: string | null;
  timerRemaining: number | null;
  timerInterval: ReturnType<typeof setInterval> | null;
  infoMode: InfoMode;
}

// What students see (filtered by info mode)
export interface TeamState {
  phase: GamePhase;
  round: number;
  totalRounds: number;
  firm: FirmState;
  competitors: CompetitorInfo[];
  marketSize: number;
  events: ActiveEvent[];
  timerRemaining: number | null;
  allSubmitted: boolean;
  infoMode: InfoMode;
}

export interface CompetitorInfo {
  id: string;
  name: string;
  icon: string;
  // Visible in 'fog' mode (1-round delay) and 'full' mode
  price?: number;
  // Only in 'full' mode
  quality?: number;
  brand?: number;
  customers?: number;
  marketShare?: number;
  profit?: number;
  cumulativeProfit?: number;
  bankrupt: boolean;
}

// What instructor sees (everything)
export interface InstructorState {
  code: string;
  phase: GamePhase;
  round: number;
  config: GameConfig;
  firms: Record<string, FirmState>;
  marketSize: number;
  events: ActiveEvent[];
  eventLog: MarketEvent[];
  timerRemaining: number | null;
  infoMode: InfoMode;
}

// Debrief data
export interface DebriefData {
  firms: Record<string, FirmState>;
  config: GameConfig;
  totalRounds: number;
  marketSize: number;
  eventLog: MarketEvent[];
  nashEquilibriumPrice: number;
  cooperativePrice: number;
  cooperativeProfit: number;
  actualIndustryProfit: number;
  competitionCost: number;
}

export const FIRM_ICONS = ['🚀', '⚡', '🛡️', '💎', '🔥', '🌊', '⭐', '🎯'];
export const FIRM_COLORS = ['#6366f1', '#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#a855f7', '#06b6d4', '#f97316'];
