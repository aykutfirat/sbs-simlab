import {
  ALPHA, BETA, GAMMA, NOISE_RANGE,
  MARGINAL_COST, FIXED_COST,
  QUALITY_DECAY, QUALITY_INVEST_FACTOR, MAX_QUALITY,
  BRAND_DECAY, MARKETING_FACTOR, WORD_OF_MOUTH_FACTOR, MAX_BRAND,
  MARKET_GROWTH_RATE, BANKRUPTCY_THRESHOLD,
} from './constants';
import type { FirmState, RoundRecord, ActiveEvent } from '../types';

/**
 * Compute utility for a firm (logit demand model).
 */
function computeUtility(
  quality: number,
  brand: number,
  price: number,
  priceSensitivityMultiplier: number,
): number {
  const noise = (Math.random() - 0.5) * 2 * NOISE_RANGE;
  return ALPHA * quality + BETA * brand - GAMMA * priceSensitivityMultiplier * price + noise;
}

/**
 * Resolve one round of the market simulation.
 * Mutates firm states in-place and returns the updated market size.
 */
export function resolveRound(
  firms: Record<string, FirmState>,
  currentMarketSize: number,
  round: number,
  activeEvents: ActiveEvent[],
): number {
  // Grow market
  let marketSize = Math.round(currentMarketSize * (1 + MARKET_GROWTH_RATE));

  // Apply event effects to market size
  for (const ae of activeEvents) {
    if (ae.event.type === 'recession') {
      marketSize = Math.round(marketSize * 0.80);
    }
  }

  // Check for price sensitivity multiplier from events
  let priceSensitivityMultiplier = 1;
  for (const ae of activeEvents) {
    if (ae.event.type === 'new-entrant-rumor') {
      priceSensitivityMultiplier = 1.3;
    }
  }

  const activeFirms = Object.values(firms).filter(f => !f.bankrupt);
  if (activeFirms.length === 0) return marketSize;

  // Each firm uses its submitted decisions (or defaults)
  for (const firm of activeFirms) {
    const d = firm.decisions ?? { price: firm.price, qualityInvestment: 0, marketingSpend: 0 };
    firm.price = d.price;

    // Update quality
    firm.quality = firm.quality * QUALITY_DECAY + d.qualityInvestment * QUALITY_INVEST_FACTOR;
    firm.quality = Math.max(0, Math.min(MAX_QUALITY, firm.quality));

    // Apply tech breakthrough event
    for (const ae of activeEvents) {
      if (ae.event.type === 'tech-breakthrough' && ae.remainingRounds === ae.event.duration) {
        // Only apply on first round of event — pick random active firm
        const targetIdx = Math.floor(Math.random() * activeFirms.length);
        if (activeFirms[targetIdx].id === firm.id) {
          firm.quality = Math.min(MAX_QUALITY, firm.quality + 15);
        }
      }
    }

    // Update brand
    const wordOfMouth = WORD_OF_MOUTH_FACTOR * firm.marketShare * (firm.quality / MAX_QUALITY);
    firm.brand = firm.brand * BRAND_DECAY + d.marketingSpend * MARKETING_FACTOR + wordOfMouth;
    firm.brand = Math.max(0, Math.min(MAX_BRAND, firm.brand));

    // Apply viral review event
    for (const ae of activeEvents) {
      if (ae.event.type === 'viral-review' && ae.remainingRounds === ae.event.duration) {
        const bestQuality = Math.max(...activeFirms.map(f => f.quality));
        if (firm.quality === bestQuality) {
          firm.brand = Math.min(MAX_BRAND, firm.brand + 0.2);
        }
      }
      if (ae.event.type === 'data-breach' && ae.remainingRounds === ae.event.duration) {
        // Firm with lowest quality investment gets penalized
        const decisions = activeFirms.map(f => ({
          id: f.id,
          qi: f.decisions?.qualityInvestment ?? 0,
        }));
        const minQI = Math.min(...decisions.map(d => d.qi));
        const lowestFirm = decisions.find(d => d.qi === minQI);
        if (lowestFirm && lowestFirm.id === firm.id) {
          firm.brand = Math.max(0, firm.brand - 0.15);
        }
      }
    }
  }

  // Compute utilities and market shares (logit model)
  const utilities = new Map<string, number>();
  let sumExp = 0;
  for (const firm of activeFirms) {
    const u = computeUtility(firm.quality, firm.brand, firm.price, priceSensitivityMultiplier);
    utilities.set(firm.id, u);
    sumExp += Math.exp(u);
  }

  // Distribute customers
  for (const firm of activeFirms) {
    const u = utilities.get(firm.id)!;
    firm.marketShare = Math.exp(u) / sumExp;
    firm.customers = Math.round(marketSize * firm.marketShare);
  }

  // Compute financials
  for (const firm of activeFirms) {
    const d = firm.decisions ?? { price: firm.price, qualityInvestment: 0, marketingSpend: 0 };

    firm.revenue = firm.customers * firm.price;
    const variableCost = firm.customers * MARGINAL_COST;
    const qualityCost = d.qualityInvestment;
    const marketingCost = d.marketingSpend;
    const totalCost = FIXED_COST + variableCost + qualityCost + marketingCost;
    firm.profit = firm.revenue - totalCost;
    firm.cumulativeProfit += firm.profit;

    // Record history
    const record: RoundRecord = {
      round,
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
    };
    firm.history.push(record);

    // Clear decisions for next round
    firm.decisions = null;

    // Check bankruptcy
    if (firm.cumulativeProfit < BANKRUPTCY_THRESHOLD) {
      firm.bankrupt = true;
    }
  }

  return marketSize;
}

/**
 * Compute approximate cooperative price (maximizes industry profit).
 */
export function computeCooperativePrice(firmCount: number): number {
  // With logit demand, the cooperative price is higher than Nash
  // Approximate: price where marginal revenue = marginal cost for the industry
  // For our parameters, this tends to be around $22-$25
  let bestPrice = 18;
  let bestProfit = -Infinity;

  for (let p = 8; p <= 30; p += 0.5) {
    // All firms at same price → equal share
    const share = 1 / firmCount;
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
