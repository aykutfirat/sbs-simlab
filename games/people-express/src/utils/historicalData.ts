import { HistoricalDataPoint } from '../types';

// Approximate real People Express data 1981-1986
// Quarters mapped: Year 1 = 1981, Year 5 = 1985, etc.
export const historicalData: HistoricalDataPoint[] = [
  // 1981 - Launch year
  { quarter: 0, label: 'Start', aircraft: 3, employees: 165, revenue: 0 },
  { quarter: 4, label: 'Y1 Q4', aircraft: 5, employees: 400, revenue: 10_000_000 },

  // 1982 - Early growth
  { quarter: 8, label: 'Y2 Q4', aircraft: 12, employees: 1200, revenue: 50_000_000 },

  // 1983 - Rapid expansion
  { quarter: 12, label: 'Y3 Q4', aircraft: 30, employees: 2000, revenue: 125_000_000 },

  // 1984 - Peak growth
  { quarter: 16, label: 'Y4 Q4', aircraft: 50, employees: 3000, revenue: 200_000_000 },

  // 1985 - Overextension begins
  { quarter: 20, label: 'Y5 Q4', aircraft: 70, employees: 4000, revenue: 250_000_000 },

  // 1986 - Collapse
  { quarter: 22, label: 'Y6 Q2', aircraft: 80, employees: 4200, revenue: 200_000_000, serviceQuality: 0.4 },
  { quarter: 24, label: 'Y6 Q4', aircraft: 60, employees: 3500, revenue: 150_000_000, serviceQuality: 0.3 },
];

// Get historical value interpolated for a given quarter
export function getHistoricalValue(
  quarter: number,
  field: keyof Omit<HistoricalDataPoint, 'quarter' | 'label'>
): number | undefined {
  const points = historicalData.filter(d => d[field] !== undefined);
  if (points.length === 0) return undefined;

  if (quarter <= points[0].quarter) return points[0][field];
  if (quarter >= points[points.length - 1].quarter) return points[points.length - 1][field];

  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i];
    const p1 = points[i + 1];
    if (quarter >= p0.quarter && quarter <= p1.quarter) {
      const t = (quarter - p0.quarter) / (p1.quarter - p0.quarter);
      const v0 = p0[field] as number;
      const v1 = p1[field] as number;
      return v0 + t * (v1 - v0);
    }
  }
  return undefined;
}
