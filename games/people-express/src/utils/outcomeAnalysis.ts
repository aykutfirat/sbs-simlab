import type { QuarterRecord } from '../types';

export interface OutcomeAnalysis {
  archetype: string;
  title: string;
  description: string;
  color: string;
}

export function analyzeOutcome(history: QuarterRecord[]): OutcomeAnalysis {
  const final = history[history.length - 1].state;
  const isBankrupt = final.isBankrupt;
  const peakAircraft = Math.max(...history.map(h => h.state.aircraft));
  const finalMorale = final.employeeMorale;
  const finalQuality = final.serviceQuality;

  if (isBankrupt && peakAircraft > 30 && finalQuality < 0.5) {
    return {
      archetype: 'Growth & Underinvestment',
      title: 'The Don Burr Trap',
      description: `Fleet grew faster than the organization could support. Workload spiked, morale and service collapsed, driving away passengers — a devastating death spiral mirroring the real People Express.`,
      color: 'text-red-400',
    };
  }

  if (isBankrupt) {
    return {
      archetype: 'Financial Collapse',
      title: 'Cash Crunch',
      description: `Ran out of cash before achieving sustainable operations. High fixed costs and insufficient revenue created an unsustainable financial position.`,
      color: 'text-red-400',
    };
  }

  if (peakAircraft < 10 && final.quarter >= 40) {
    return {
      archetype: 'Limits to Growth',
      title: 'Conservative Captain',
      description: `Conservative strategy avoided collapse but limited upside. Survived but missed the opportunity that low-cost air travel represented.`,
      color: 'text-yellow-400',
    };
  }

  if (final.quarter >= 40 && final.netIncome > 0 && peakAircraft >= 10 && peakAircraft < 40) {
    return {
      archetype: 'Balanced Growth',
      title: 'Steady Climber',
      description: `Found a balance between growth and operational stability. Grew meaningfully while maintaining service quality and employee morale.`,
      color: 'text-cockpit-accent',
    };
  }

  if (final.quarter >= 40 && final.netIncome > 0 && finalMorale > 0.5 && finalQuality > 0.5) {
    return {
      archetype: 'Sustainable Enterprise',
      title: 'Master Strategist',
      description: `Successfully balanced growth with service quality. Investing in people alongside fleet expansion built a sustainable airline.`,
      color: 'text-green-400',
    };
  }

  return {
    archetype: 'Mixed Results',
    title: 'Turbulent Flight',
    description: `Survived but showed signs of the tensions that plagued the real People Express. Every major airline decision has delayed consequences.`,
    color: 'text-cockpit-accent',
  };
}
