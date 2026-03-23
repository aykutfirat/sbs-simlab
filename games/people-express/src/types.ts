// Player decisions made each quarter
export interface PlayerDecisions {
  aircraftPurchases: number;      // planes/qtr, 0–20
  peopleFare: number;             // $/seat-mile, 0.03–0.25
  marketingFraction: number;      // fraction of revenue, 0.00–0.50
  hiring: number;                 // employees/qtr, 0–500
  targetServiceScope: number;     // 0.20–1.00
}

// Full simulation state at a point in time
export interface SimulationState {
  // Time
  quarter: number;  // 0 = initial, 1–40 = game quarters
  year: number;
  quarterInYear: number; // 1–4

  // Fleet subsystem
  aircraftOnOrder: number;
  aircraft: number;
  seatCapacity: number;
  availableSeatMiles: number;

  // HR subsystem
  employeesInTraining: number;
  experiencedEmployees: number;
  totalEmployees: number;
  employeeMorale: number;
  workload: number;
  quitRate: number;
  productivity: number;

  // Service subsystem
  serviceQuality: number;
  serviceReputation: number;

  // Market subsystem
  pePassengers: number;         // seat-miles demanded/served
  marketAwareness: number;
  potentialDemand: number;
  loadFactor: number;
  peMarketShare: number;
  competitorFare: number;
  totalMarket: number;
  fareAttractiveness: number;

  // Financial subsystem
  cash: number;
  cumulativeProfit: number;
  stockPrice: number;
  revenue: number;
  totalCosts: number;
  netIncome: number;
  aircraftCosts: number;
  employeeCosts: number;
  marketingCosts: number;
  overheadCosts: number;
  aircraftPurchaseCosts: number;

  // Game status
  isBankrupt: boolean;
  isGameOver: boolean;

  // Decisions that produced this state (for history)
  decisions: PlayerDecisions;
}

// History entry for charts
export interface QuarterRecord {
  quarter: number;
  label: string;  // e.g., "Y1 Q1"
  state: SimulationState;
}

// Game phase
export type GamePhase = 'start' | 'playing' | 'gameover';

// Full game state
export interface GameState {
  phase: GamePhase;
  currentState: SimulationState;
  history: QuarterRecord[];
  currentDecisions: PlayerDecisions;
}

// Historical PE data point for comparison
export interface HistoricalDataPoint {
  quarter: number;
  label: string;
  aircraft?: number;
  revenue?: number;    // per quarter in $
  employees?: number;
  serviceQuality?: number;
}

// ── Multiplayer Types ──────────────────────────────────────────

export type RoomPhase = 'lobby' | 'playing' | 'gameover';
export type AdvanceMode = 'manual' | 'timer';
export type TeamConnectionStatus = 'connected' | 'disconnected';

export interface RoomConfig {
  advanceMode: AdvanceMode;
  timerDuration: number; // seconds per quarter
  maxTeams: number;
}

export interface TeamSummary {
  teamName: string;
  connectionStatus: TeamConnectionStatus;
  hasSubmitted: boolean;
  isBankrupt: boolean;
  currentState: SimulationState;
  history: QuarterRecord[];
  decisions: PlayerDecisions;
}

export interface RoomState {
  gameCode: string;
  phase: RoomPhase;
  config: RoomConfig;
  teams: Record<string, TeamSummary>;
  timerRemaining: number | null; // seconds, null if no timer
  currentQuarter: number;
}

// Socket event payloads
export interface CreateGamePayload {
  config: RoomConfig;
}

export interface JoinGamePayload {
  gameCode: string;
  teamName: string;
}

export interface SubmitDecisionsPayload {
  gameCode: string;
  teamName: string;
  decisions: PlayerDecisions;
}

export interface TeamGameStatePayload {
  currentState: SimulationState;
  history: QuarterRecord[];
  decisions: PlayerDecisions;
  hasSubmitted: boolean;
  phase: RoomPhase;
  timerRemaining: number | null;
  currentQuarter: number;
}
