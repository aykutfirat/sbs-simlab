import { SURVIVAL_ITEMS } from '../data/items';

/**
 * Calculate error score: sum of absolute differences between
 * player ranking and NASA ranking for each item.
 * Lower score = better. Perfect score = 0. Max = 112.
 */
export function calculateErrorScore(ranking: string[]): number {
  let totalError = 0;
  for (let i = 0; i < ranking.length; i++) {
    const itemId = ranking[i];
    const item = SURVIVAL_ITEMS.find(it => it.id === itemId);
    if (item) {
      const playerRank = i + 1;
      totalError += Math.abs(playerRank - item.nasaRank);
    }
  }
  return totalError;
}

/**
 * Get the best (lowest) individual score among team members.
 */
export function getBestIndividualScore(memberScores: number[]): number {
  return Math.min(...memberScores);
}

/**
 * Get the average individual score for a team.
 */
export function getAverageIndividualScore(memberScores: number[]): number {
  if (memberScores.length === 0) return 0;
  const sum = memberScores.reduce((a, b) => a + b, 0);
  return Math.round((sum / memberScores.length) * 10) / 10;
}

/**
 * Calculate synergy: how much the team improved over its best individual.
 * Positive = team beat its best member (synergy achieved).
 * Negative = team did worse than its best member.
 */
export function calculateSynergy(teamScore: number, bestIndividualScore: number): number {
  return bestIndividualScore - teamScore;
}

/**
 * Score interpretation ranges based on NASA guidelines.
 */
export function getScoreLabel(score: number): string {
  if (score <= 25) return 'Excellent';
  if (score <= 32) return 'Good';
  if (score <= 45) return 'Average';
  if (score <= 55) return 'Fair';
  return 'Poor — suggests a significant misunderstanding of survival priorities';
}

/**
 * Per-item error: difference between player rank and NASA rank.
 */
export function getItemError(itemId: string, ranking: string[]): number {
  const index = ranking.indexOf(itemId);
  if (index === -1) return 0;
  const item = SURVIVAL_ITEMS.find(it => it.id === itemId);
  if (!item) return 0;
  return Math.abs((index + 1) - item.nasaRank);
}
