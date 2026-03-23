import type { FirmState, Decisions, AIStrategy } from '../types';
import { computeNashEquilibrium } from './NashSolver';
import { DEFAULT_PRICE, MIN_PRICE, MAX_PRICE, MAX_QUALITY_INVESTMENT, MAX_MARKETING_SPEND } from './constants';

/**
 * Generate decisions for an AI bot based on its strategy.
 */
export function getAIDecisions(
  strategy: AIStrategy,
  firm: FirmState,
  allFirms: FirmState[],
  round: number,
  totalFirms: number,
): Decisions {
  switch (strategy) {
    case 'nash':
      return nashStrategy(totalFirms);
    case 'predator':
      return predatorStrategy(firm, allFirms);
    case 'tit-for-tat':
      return titForTatStrategy(firm, allFirms, round);
    case 'random':
      return randomStrategy();
  }
}

function nashStrategy(totalFirms: number): Decisions {
  const nashPrice = computeNashEquilibrium(totalFirms);
  return {
    price: Math.round(nashPrice * 100) / 100,
    qualityInvestment: 3000, // moderate steady investment
    marketingSpend: 2000,
  };
}

function predatorStrategy(firm: FirmState, allFirms: FirmState[]): Decisions {
  const otherPrices = allFirms
    .filter(f => f.id !== firm.id && !f.bankrupt)
    .map(f => f.price);

  let targetPrice: number;
  if (otherPrices.length > 0) {
    const lowestCompetitor = Math.min(...otherPrices);
    targetPrice = lowestCompetitor - 1;
    // If we've been undercutting for a while and market share is high, raise prices
    if (firm.marketShare > 0.4 && firm.history.length > 3) {
      targetPrice = firm.price + 2;
    }
  } else {
    targetPrice = DEFAULT_PRICE;
  }

  return {
    price: Math.max(MIN_PRICE, Math.min(MAX_PRICE, targetPrice)),
    qualityInvestment: 1000, // minimal investment
    marketingSpend: 1500,
  };
}

function titForTatStrategy(firm: FirmState, allFirms: FirmState[], round: number): Decisions {
  let targetPrice: number;

  if (round <= 1) {
    // Start cooperative (high price)
    targetPrice = 22;
  } else {
    // Mirror average competitor price from previous round
    const otherPrices = allFirms
      .filter(f => f.id !== firm.id && !f.bankrupt)
      .map(f => f.price);

    if (otherPrices.length > 0) {
      const avgPrice = otherPrices.reduce((a, b) => a + b, 0) / otherPrices.length;
      targetPrice = avgPrice;
    } else {
      targetPrice = 20;
    }
  }

  return {
    price: Math.max(MIN_PRICE, Math.min(MAX_PRICE, Math.round(targetPrice * 100) / 100)),
    qualityInvestment: 2500,
    marketingSpend: 2500,
  };
}

function randomStrategy(): Decisions {
  const price = 12 + Math.random() * 12; // $12-$24
  return {
    price: Math.round(price * 100) / 100,
    qualityInvestment: Math.round(Math.random() * MAX_QUALITY_INVESTMENT),
    marketingSpend: Math.round(Math.random() * MAX_MARKETING_SPEND),
  };
}
