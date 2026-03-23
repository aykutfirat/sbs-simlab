import { GameConfig, RoundResult } from '../types';

export function calculateRound(
  config: GameConfig,
  day: number,
  order: number,
  demand: number,
  previousCumulativeProfit: number
): RoundResult {
  const sold = Math.min(order, demand);
  const wasted = Math.max(order - demand, 0);
  const shortage = Math.max(demand - order, 0);
  const revenue = sold * config.price;
  const dailyCost = order * config.cost;
  const salvageValue = wasted * config.salvage;
  const profit = revenue - dailyCost + salvageValue;
  const cumulativeProfit = previousCumulativeProfit + profit;

  return {
    day,
    order,
    demand,
    sold,
    wasted,
    shortage,
    revenue,
    dailyCost,
    salvageValue,
    profit,
    cumulativeProfit,
  };
}

export function getFeedbackMessage(
  order: number,
  demand: number
): { message: string; type: 'perfect' | 'waste' | 'shortage' | 'neutral' } {
  const diff = Math.abs(order - demand);
  const threshold = demand * 0.1;

  if (diff <= threshold) {
    return { message: 'Perfect day!', type: 'perfect' };
  }
  if (order > demand && (order - demand) / order > 0.2) {
    return { message: 'Lots of leftovers today...', type: 'waste' };
  }
  if (demand > order && (demand - order) / demand > 0.2) {
    return { message: 'Customers turned away!', type: 'shortage' };
  }
  return { message: 'Not bad!', type: 'neutral' };
}
