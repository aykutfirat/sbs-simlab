import { mulberry32 } from '../utils/seededRng';

export function generateDemand(seed: number, rounds: number, mu: number, sigma: number): number[] {
  const rng = mulberry32(seed);
  const demands: number[] = [];

  for (let i = 0; i < rounds; i++) {
    // Box-Muller transform for normal distribution
    const u1 = rng();
    const u2 = rng();
    const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    const demand = Math.max(0, Math.round(mu + sigma * z));
    demands.push(demand);
  }

  return demands;
}
