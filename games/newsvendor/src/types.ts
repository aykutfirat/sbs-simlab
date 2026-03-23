export interface GameConfig {
  price: number;
  cost: number;
  salvage: number;
  mu: number;
  sigma: number;
  rounds: number;
  seed: number;
  mode: 'easy' | 'medium' | 'hard' | 'custom';
}

export interface RoundResult {
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

export interface GameState {
  config: GameConfig;
  demands: number[];
  rounds: RoundResult[];
  currentDay: number;
  cumulativeProfit: number;
  phase: 'start' | 'playing' | 'debrief';
  pendingOrder: number | null;
  showingResult: boolean;
}

export interface BiasReport {
  pullToCenter: {
    detected: boolean;
    avgOrder: number;
    optimalQ: number;
    meanDemand: number;
    category: 'pull-to-center' | 'risk-seeking' | 'very-conservative' | 'near-optimal';
    description: string;
  };
  demandChasing: {
    detected: boolean;
    correlation: number;
    description: string;
  };
  orderVariability: {
    detected: boolean;
    orderStdDev: number;
    optimalStdDev: number;
    description: string;
  };
}

export interface PerformanceStats {
  totalProfit: number;
  avgDailyProfit: number;
  avgOrder: number;
  avgDemand: number;
  totalWasted: number;
  totalShortage: number;
  totalSold: number;
  totalDemand: number;
  fillRate: number;
}

export interface WhatIfData {
  day: number;
  playerCumProfit: number;
  optimalCumProfit: number;
  perfectCumProfit: number;
}
