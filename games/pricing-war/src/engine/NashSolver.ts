import { ALPHA, BETA, GAMMA, MARGINAL_COST, FIXED_COST, MIN_PRICE, MAX_PRICE } from './constants';

/**
 * Compute approximate Nash equilibrium price using best-response iteration.
 *
 * For symmetric logit Bertrand with N firms, the first-order condition is:
 *   price* = marginalCost + 1 / (gamma * (1 - 1/N))
 *
 * This gives a closed-form approximation that we refine with iteration.
 */
export function computeNashEquilibrium(
  firmCount: number,
  avgQuality: number = 50,
  avgBrand: number = 0.5,
): number {
  // Closed-form symmetric Nash for logit:
  // p* = MC + 1 / (γ * (1 - 1/N))
  const markup = 1 / (GAMMA * (1 - 1 / Math.max(firmCount, 2)));
  let nashPrice = MARGINAL_COST + markup;

  // Refine with best-response iteration
  const prices = new Array(firmCount).fill(nashPrice);

  for (let iter = 0; iter < 50; iter++) {
    let maxDelta = 0;
    for (let i = 0; i < firmCount; i++) {
      const bestResponse = findBestResponse(i, prices, firmCount, avgQuality, avgBrand);
      const delta = Math.abs(bestResponse - prices[i]);
      prices[i] = bestResponse;
      maxDelta = Math.max(maxDelta, delta);
    }
    if (maxDelta < 0.01) break;
  }

  nashPrice = prices.reduce((a, b) => a + b, 0) / firmCount;
  return Math.round(Math.max(MIN_PRICE, Math.min(MAX_PRICE, nashPrice)) * 100) / 100;
}

function findBestResponse(
  firmIndex: number,
  prices: number[],
  _firmCount: number,
  avgQuality: number,
  avgBrand: number,
): number {
  let bestPrice = prices[firmIndex];
  let bestProfit = -Infinity;

  for (let p = MIN_PRICE; p <= MAX_PRICE; p += 0.25) {
    // Compute utility for this firm
    const myUtility = ALPHA * avgQuality + BETA * avgBrand - GAMMA * p;

    // Sum of exp(utility) for all firms
    let sumExp = Math.exp(myUtility);
    for (let j = 0; j < prices.length; j++) {
      if (j === firmIndex) continue;
      const uj = ALPHA * avgQuality + BETA * avgBrand - GAMMA * prices[j];
      sumExp += Math.exp(uj);
    }

    const share = Math.exp(myUtility) / sumExp;
    const customers = 10000 * share;
    const revenue = customers * p;
    const cost = FIXED_COST + customers * MARGINAL_COST;
    const profit = revenue - cost;

    if (profit > bestProfit) {
      bestProfit = profit;
      bestPrice = p;
    }
  }

  return bestPrice;
}

/**
 * Compute the profit each firm would earn if all played Nash equilibrium.
 */
export function computeNashProfit(firmCount: number): number {
  const nashPrice = computeNashEquilibrium(firmCount);
  const share = 1 / firmCount;
  const customers = 10000 * share;
  const revenue = customers * nashPrice;
  const cost = FIXED_COST + customers * MARGINAL_COST;
  return revenue - cost;
}
