export interface SurvivalItem {
  id: string;
  name: string;
  nasaRank: number;
  reasoning: string;
}

export type GamePhase = 'lobby' | 'individual' | 'team' | 'results' | 'debrief';

export interface Player {
  name: string;
  teamId: string | null;
  connected: boolean;
  individualRanking: string[] | null; // item IDs in ranked order
  individualScore: number | null;
}

export interface ChatMessage {
  sender: string;
  text: string;
  timestamp: number;
}

export interface Team {
  id: string;
  name: string;
  members: string[]; // player names
  consensusRanking: string[] | null;
  confirmedBy: string[]; // player names who confirmed
  teamScore: number | null;
  chat: ChatMessage[];
}

export interface GameSettings {
  individualTimerSeconds: number; // 0 = no timer
  teamTimerSeconds: number; // 0 = no timer
  teamSize: number;
}

export interface GameRoom {
  code: string;
  phase: GamePhase;
  settings: GameSettings;
  players: Record<string, Player>;
  teams: Record<string, Team>;
  instructorSocketId: string | null;
  timerRemaining: number | null;
  timerInterval: ReturnType<typeof setInterval> | null;
}

// Client-side state sent from server
export interface PlayerState {
  phase: GamePhase;
  player: Player;
  team: Team | null;
  timerRemaining: number | null;
  allPlayersSubmitted: boolean;
  allTeamsConfirmed: boolean;
}

export interface InstructorState {
  code: string;
  phase: GamePhase;
  settings: GameSettings;
  players: Record<string, Player>;
  teams: Record<string, Team>;
  timerRemaining: number | null;
}

export interface GameResults {
  players: Record<string, {
    name: string;
    teamId: string | null;
    individualScore: number | null;
    individualRanking: string[] | null;
  }>;
  teams: Record<string, {
    id: string;
    name: string;
    members: string[];
    teamScore: number | null;
    consensusRanking: string[] | null;
    bestIndividualScore: number;
    averageIndividualScore: number;
    synergy: number;
  }>;
}
