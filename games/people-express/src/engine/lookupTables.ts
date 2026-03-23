// Piecewise-linear interpolation for nonlinear relationships

type LookupPoint = [number, number];

export function interpolate(table: LookupPoint[], x: number): number {
  if (x <= table[0][0]) return table[0][1];
  if (x >= table[table.length - 1][0]) return table[table.length - 1][1];

  for (let i = 0; i < table.length - 1; i++) {
    const [x0, y0] = table[i];
    const [x1, y1] = table[i + 1];
    if (x >= x0 && x <= x1) {
      const t = (x - x0) / (x1 - x0);
      return y0 + t * (y1 - y0);
    }
  }
  return table[table.length - 1][1];
}

// Effect of workload on target morale
// workload → morale multiplier
export const workloadToMorale: LookupPoint[] = [
  [0.5, 0.7],   // underworked — slightly low morale (boredom)
  [0.8, 0.9],   // slightly underworked
  [1.0, 1.0],   // balanced
  [1.2, 0.8],   // somewhat overworked
  [1.5, 0.5],   // seriously overworked
  [2.0, 0.2],   // extreme overwork — morale collapses
];

// Effect of morale on quit rate (multiplier on base quit rate)
export const moraleToQuitMultiplier: LookupPoint[] = [
  [0.2, 3.0],   // terrible morale — 3x normal quits
  [0.4, 2.0],
  [0.6, 1.2],
  [0.8, 0.8],
  [1.0, 0.5],   // excellent morale — half normal quits
];

// Effect of fare ratio on demand attractiveness
// (pe_fare / competitor_fare) → demand multiplier
export const fareRatioToDemand: LookupPoint[] = [
  [0.3, 2.5],   // PE fare is 30% of competitor — strong demand
  [0.5, 1.8],
  [0.7, 1.3],
  [1.0, 1.0],   // parity
  [1.2, 0.5],   // PE is 20% more expensive — demand craters
  [1.5, 0.1],
];

// Effect of service reputation on demand
// Steeper curve: bad reputation kills demand more aggressively
export const reputationToDemand: LookupPoint[] = [
  [0.0, 0.10],   // terrible rep — barely anyone flies PE
  [0.2, 0.30],
  [0.4, 0.55],
  [0.6, 0.80],
  [0.8, 0.95],
  [1.0, 1.10],   // excellent rep — slight premium demand
];

// Market share → competitive response (fare reduction fraction)
// Stronger competitive response at higher shares
export const marketShareToCompetitorResponse: LookupPoint[] = [
  [0.0, 0.00],
  [0.05, 0.03],
  [0.10, 0.08],
  [0.20, 0.18],
  [0.30, 0.28],
  [0.40, 0.35],
  [0.50, 0.40],  // PE dominates — competitors fight hard
];
