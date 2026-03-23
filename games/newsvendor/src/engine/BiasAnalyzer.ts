import { BiasReport, PerformanceStats, RoundResult, GameConfig } from '../types';
import { mean, standardDeviation, pearsonCorrelation } from '../utils/statistics';
import { computeOptimalQ } from './OptimalSolver';

export function computePerformanceStats(
  rounds: RoundResult[],
  demands: number[]
): PerformanceStats {
  const totalProfit = rounds[rounds.length - 1].cumulativeProfit;
  const avgDailyProfit = totalProfit / rounds.length;
  const orders = rounds.map((r) => r.order);
  const avgOrder = mean(orders);
  const avgDemand = mean(demands.slice(0, rounds.length));
  const totalWasted = rounds.reduce((sum, r) => sum + r.wasted, 0);
  const totalShortage = rounds.reduce((sum, r) => sum + r.shortage, 0);
  const totalSold = rounds.reduce((sum, r) => sum + r.sold, 0);
  const totalDemand = demands.slice(0, rounds.length).reduce((sum, d) => sum + d, 0);
  const fillRate = totalDemand > 0 ? totalSold / totalDemand : 1;

  return {
    totalProfit,
    avgDailyProfit,
    avgOrder,
    avgDemand,
    totalWasted,
    totalShortage,
    totalSold,
    totalDemand,
    fillRate,
  };
}

export function analyzeBiases(
  rounds: RoundResult[],
  demands: number[],
  config: GameConfig
): BiasReport {
  const orders = rounds.map((r) => r.order);
  const optimalQ = computeOptimalQ(config);
  const meanDemand = config.mu;
  const avgOrder = mean(orders);

  // Pull-to-center analysis
  let pullCategory: BiasReport['pullToCenter']['category'];
  let pullDescription: string;

  const distToOptimal = Math.abs(avgOrder - optimalQ);
  const distToMean = Math.abs(avgOrder - meanDemand);

  if (distToOptimal <= 5) {
    pullCategory = 'near-optimal';
    pullDescription = `Your average order of ${avgOrder.toFixed(0)} bagels was very close to the optimal ${optimalQ}. Excellent intuition!`;
  } else if (avgOrder < meanDemand) {
    pullCategory = 'very-conservative';
    pullDescription = `Your average order of ${avgOrder.toFixed(0)} bagels was below even the average demand of ${meanDemand}. You were very conservative, missing out on many profitable sales.`;
  } else if (avgOrder >= meanDemand && avgOrder < optimalQ - 5) {
    pullCategory = 'pull-to-center';
    pullDescription = `You exhibited pull-to-center bias — your average order of ${avgOrder.toFixed(0)} bagels was between the average demand (${meanDemand}) and the optimal quantity (${optimalQ}). This is the most common behavioral pattern in newsvendor experiments. Since lost sales ($${(config.price - config.cost).toFixed(2)} each) cost more than waste ($${(config.cost - config.salvage).toFixed(2)} each), you should have ordered higher.`;
  } else if (avgOrder > optimalQ + 5) {
    pullCategory = 'risk-seeking';
    pullDescription = `Your average order of ${avgOrder.toFixed(0)} bagels exceeded the optimal quantity of ${optimalQ}. You were risk-seeking, leading to more waste than necessary.`;
  } else {
    pullCategory = 'near-optimal';
    pullDescription = `Your average order of ${avgOrder.toFixed(0)} bagels was close to the optimal ${optimalQ}. Well done!`;
  }

  // Demand chasing analysis
  const prevDemands = demands.slice(0, rounds.length - 1);
  const nextOrders = orders.slice(1);
  const chasingCorrelation = pearsonCorrelation(prevDemands, nextOrders);
  const chasingDetected = Math.abs(chasingCorrelation) > 0.3;

  let chasingDescription: string;
  if (chasingDetected && chasingCorrelation > 0) {
    chasingDescription = `You exhibited demand chasing — adjusting your order based on yesterday's demand (correlation: ${chasingCorrelation.toFixed(2)}). Since each day's demand is independent, yesterday's demand contains no information about today's. The optimal strategy ignores past demand entirely.`;
  } else if (chasingDetected && chasingCorrelation < 0) {
    chasingDescription = `Interestingly, you showed a negative reaction to demand — ordering less after high-demand days and more after low-demand days (correlation: ${chasingCorrelation.toFixed(2)}). This "contrarian" pattern is also suboptimal since daily demands are independent.`;
  } else {
    chasingDescription = `You did not exhibit significant demand chasing (correlation: ${chasingCorrelation.toFixed(2)}). Your orders were relatively independent of recent demand — which is actually rational behavior!`;
  }

  // Order variability analysis
  const orderStdDev = standardDeviation(orders);
  const variabilityDetected = orderStdDev > 10;

  let variabilityDescription: string;
  if (variabilityDetected) {
    variabilityDescription = `The optimal strategy is to order the same quantity (${optimalQ}) every single day. Your orders varied with a standard deviation of ${orderStdDev.toFixed(1)} bagels. This variability reduced your profit because the optimal order doesn't change — the demand distribution is the same every day.`;
  } else {
    variabilityDescription = `Your orders were fairly consistent (std dev: ${orderStdDev.toFixed(1)}), which is close to optimal behavior. The best strategy is to order the same quantity every day since the demand distribution doesn't change.`;
  }

  return {
    pullToCenter: {
      detected: pullCategory === 'pull-to-center',
      avgOrder,
      optimalQ,
      meanDemand,
      category: pullCategory,
      description: pullDescription,
    },
    demandChasing: {
      detected: chasingDetected,
      correlation: chasingCorrelation,
      description: chasingDescription,
    },
    orderVariability: {
      detected: variabilityDetected,
      orderStdDev,
      optimalStdDev: 0,
      description: variabilityDescription,
    },
  };
}
