import { GameConfig, RoundResult, WhatIfData } from '../types';
import { normalInvCDF } from '../utils/statistics';
import { calculateRound } from './GameEngine';

export function computeCriticalRatio(config: GameConfig): number {
  const cu = config.price - config.cost; // underage cost
  const co = config.cost - config.salvage; // overage cost
  return cu / (cu + co);
}

export function computeOptimalQ(config: GameConfig): number {
  const cr = computeCriticalRatio(config);
  const z = normalInvCDF(cr);
  return Math.round(config.mu + config.sigma * z);
}

export function computeUnderageCost(config: GameConfig): number {
  return config.price - config.cost;
}

export function computeOverageCost(config: GameConfig): number {
  return config.cost - config.salvage;
}

export function computeOptimalExpectedDailyProfit(config: GameConfig): number {
  // Monte Carlo approximation with large sample
  const optimalQ = computeOptimalQ(config);
  const trials = 100000;
  let totalProfit = 0;

  // Use a simple analytical approach instead:
  // E[profit] = p * E[min(Q,D)] - c * Q + v * E[max(Q-D,0)]
  // For normal distribution, we can compute this analytically
  // but Monte Carlo is simpler and robust

  // Using seeded RNG for reproducibility
  let seed = 42;
  for (let i = 0; i < trials; i++) {
    // Simple LCG for speed
    seed = (seed * 1664525 + 1013904223) & 0xffffffff;
    const u1 = (seed >>> 0) / 4294967296;
    seed = (seed * 1664525 + 1013904223) & 0xffffffff;
    const u2 = (seed >>> 0) / 4294967296;
    const z = Math.sqrt(-2 * Math.log(Math.max(u1, 1e-10))) * Math.cos(2 * Math.PI * u2);
    const demand = Math.max(0, Math.round(config.mu + config.sigma * z));

    const sold = Math.min(optimalQ, demand);
    const wasted = Math.max(optimalQ - demand, 0);
    const profit = sold * config.price - optimalQ * config.cost + wasted * config.salvage;
    totalProfit += profit;
  }

  return totalProfit / trials;
}

export function computeWhatIfData(
  config: GameConfig,
  demands: number[],
  playerRounds: RoundResult[]
): WhatIfData[] {
  const optimalQ = computeOptimalQ(config);
  const data: WhatIfData[] = [];

  let optimalCum = 0;
  let perfectCum = 0;

  for (let i = 0; i < playerRounds.length; i++) {
    const demand = demands[i];

    // Optimal constant ordering
    const optimalSold = Math.min(optimalQ, demand);
    const optimalWasted = Math.max(optimalQ - demand, 0);
    const optimalProfit = optimalSold * config.price - optimalQ * config.cost + optimalWasted * config.salvage;
    optimalCum += optimalProfit;

    // Perfect foresight (order exactly demand)
    const perfectProfit = demand * config.price - demand * config.cost;
    perfectCum += perfectProfit;

    data.push({
      day: i + 1,
      playerCumProfit: playerRounds[i].cumulativeProfit,
      optimalCumProfit: optimalCum,
      perfectCumProfit: perfectCum,
    });
  }

  return data;
}
