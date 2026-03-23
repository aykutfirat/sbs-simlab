import { GameConfig, RoundResult } from './types';

// Server → Client room state (instructor view)
export interface RoomState {
  gameCode: string;
  phase: 'lobby' | 'playing' | 'debrief';
  config: GameConfig;
  currentRound: number;
  showingResults: boolean; // true when demand has been revealed for current round
  players: Record<string, PlayerSummary>;
  timerRemaining: number | null;
  advanceMode: 'manual' | 'timer' | 'auto';
  timerDuration: number;
}

export interface PlayerSummary {
  name: string;
  connected: boolean;
  currentOrder: number | null;
  hasSubmitted: boolean;
  cumulativeProfit: number;
  roundsPlayed: number;
  avgOrder: number;
  lastOrder: number | null;
  lastDemand: number | null;
}

// Server → Client player state (player view)
export interface PlayerGameState {
  gameCode: string;
  playerName: string;
  phase: 'lobby' | 'playing' | 'debrief';
  config: GameConfig;
  currentRound: number;
  showingResults: boolean;
  rounds: RoundResult[];
  cumulativeProfit: number;
  demands: number[]; // only revealed demands (up to current round if showing results)
  timerRemaining: number | null;
  currentResult: RoundResult | null; // latest round result (after reveal)
}

// Server → Client debrief data (for comparative analysis)
export interface DebriefData {
  gameCode: string;
  config: GameConfig;
  demands: number[]; // full demand sequence
  players: Record<string, PlayerDebriefData>;
}

export interface PlayerDebriefData {
  name: string;
  rounds: RoundResult[];
  totalProfit: number;
  avgOrder: number;
  avgDemand: number;
  totalWasted: number;
  totalShortage: number;
  fillRate: number;
}

// Client → Server events
export interface CreateGamePayload {
  config: Omit<GameConfig, 'seed'> & { seed?: number };
  advanceMode: 'manual' | 'timer' | 'auto';
  timerDuration: number;
  password?: string;
}

export interface JoinGamePayload {
  gameCode: string;
  playerName: string;
}

export interface SubmitOrderPayload {
  gameCode: string;
  playerName: string;
  order: number;
}
