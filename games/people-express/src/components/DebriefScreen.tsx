import { QuarterRecord } from '../types';
import { formatCurrency } from '../utils/formatting';
import TimeSeriesChart from './charts/TimeSeriesChart';
import { historicalData } from '../utils/historicalData';

interface DebriefScreenProps {
  history: QuarterRecord[];
  onRestart: () => void;
  onBack: () => void;
}

function analyzeOutcome(history: QuarterRecord[]): {
  archetype: string;
  title: string;
  description: string;
  color: string;
} {
  const final = history[history.length - 1].state;
  const isBankrupt = final.isBankrupt;
  const peakAircraft = Math.max(...history.map(h => h.state.aircraft));
  const finalMorale = final.employeeMorale;
  const finalQuality = final.serviceQuality;

  // Overexpansion death spiral
  if (isBankrupt && peakAircraft > 30 && finalQuality < 0.5) {
    return {
      archetype: 'Growth & Underinvestment',
      title: 'The Don Burr Trap',
      description: `The Growth & Underinvestment archetype dominated your game. Your fleet grew faster than your organization could support. As workload spiked, morale and service quality collapsed, driving away passengers and creating a devastating death spiral. This mirrors exactly what happened to the real People Express.`,
      color: 'text-red-400',
    };
  }

  // Bankruptcy from other causes
  if (isBankrupt) {
    return {
      archetype: 'Financial Collapse',
      title: 'Cash Crunch',
      description: `Your airline ran out of cash before it could achieve sustainable operations. The combination of high fixed costs and insufficient revenue created an unsustainable financial position. Airlines have enormous capital requirements — timing of investments relative to revenue growth is critical.`,
      color: 'text-red-400',
    };
  }

  // Conservative stagnation
  if (peakAircraft < 10 && final.quarter >= 40) {
    return {
      archetype: 'Limits to Growth',
      title: 'Conservative Captain',
      description: `Balancing loops constrained your growth — your conservative strategy avoided collapse but limited upside. While you survived, you missed the opportunity that low-cost air travel represented. Sometimes the biggest risk is not taking enough risk. The market was there for the taking.`,
      color: 'text-yellow-400',
    };
  }

  // Moderate success
  if (final.quarter >= 40 && final.netIncome > 0 && peakAircraft >= 10 && peakAircraft < 40) {
    return {
      archetype: 'Balanced Growth',
      title: 'Steady Climber',
      description: `You found a balance between growth and operational stability. Your airline grew meaningfully while maintaining service quality and employee morale. This required discipline that the real PE management lacked — resisting the temptation of explosive growth.`,
      color: 'text-cockpit-accent',
    };
  }

  // Strong success
  if (final.quarter >= 40 && final.netIncome > 0 && finalMorale > 0.5 && finalQuality > 0.5) {
    return {
      archetype: 'Sustainable Enterprise',
      title: 'Master Strategist',
      description: `You successfully balanced growth with service quality — something the real PE management couldn't achieve. By investing in people alongside fleet expansion and managing workload carefully, you built a sustainable airline. This demonstrates the power of systems thinking in management.`,
      color: 'text-green-400',
    };
  }

  // Default - survived but struggling
  return {
    archetype: 'Mixed Results',
    title: 'Turbulent Flight',
    description: `Your airline survived but showed signs of the tensions that plagued the real People Express. The interplay between growth pressure and operational capacity is the central challenge — every major airline decision has delayed consequences that may not be visible for several quarters.`,
    color: 'text-cockpit-accent',
  };
}

export default function DebriefScreen({ history, onRestart, onBack }: DebriefScreenProps) {
  const analysis = analyzeOutcome(history);

  // Prepare comparison data: player vs historical
  const comparisonData = history.map(h => {
    const q = h.state.quarter;
    const historicalAircraft = getHistoricalInterp(q, 'aircraft');
    const historicalRevenue = getHistoricalInterp(q, 'revenue');
    return {
      label: h.label,
      playerAircraft: Math.round(h.state.aircraft),
      historicalAircraft: historicalAircraft != null ? Math.round(historicalAircraft) : null,
      playerRevenue: h.state.revenue,
      historicalRevenue,
      playerQuality: h.state.serviceQuality,
    };
  });

  return (
    <div className="min-h-screen bg-cockpit-bg p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-1">Post-Flight Debrief</h1>
          <p className="text-cockpit-muted">Analysis of your management decisions and their consequences</p>
        </div>

        {/* Feedback Loop Analysis */}
        <div className="bg-cockpit-panel border border-cockpit-border rounded-xl p-6 mb-6">
          <div className="flex items-center gap-3 mb-3">
            <span className={`text-sm font-mono px-2 py-0.5 rounded border ${analysis.color} border-current bg-current/10`}>
              {analysis.archetype}
            </span>
          </div>
          <h2 className={`text-xl font-bold ${analysis.color} mb-3`}>{analysis.title}</h2>
          <p className="text-cockpit-text leading-relaxed">{analysis.description}</p>
        </div>

        {/* Historical Comparison Charts */}
        <div className="space-y-4 mb-6">
          <h3 className="text-sm font-semibold text-cockpit-muted uppercase tracking-wider">
            Your Trajectory vs. Real People Express
          </h3>

          <TimeSeriesChart
            title="Fleet Size: You vs. History"
            data={comparisonData}
            series={[
              { key: 'playerAircraft', name: 'Your Fleet', color: '#3b82f6' },
              { key: 'historicalAircraft', name: 'Real PE', color: '#ef4444', dashed: true },
            ]}
            yAxisFormatter={(v) => String(Math.round(v))}
            height={220}
          />

          <TimeSeriesChart
            title="Revenue: You vs. History"
            data={comparisonData}
            series={[
              { key: 'playerRevenue', name: 'Your Revenue', color: '#22c55e' },
              { key: 'historicalRevenue', name: 'Real PE', color: '#ef4444', dashed: true },
            ]}
            yAxisFormatter={formatCurrency}
            height={220}
          />
        </div>

        {/* Key discussion question */}
        <div className="bg-blue-950/30 border border-blue-800/30 rounded-xl p-6 mb-6">
          <h3 className="text-sm font-semibold text-cockpit-accent mb-3">
            Discussion Question
          </h3>
          <p className="text-cockpit-text leading-relaxed italic">
            "What data or analytics tools could have helped PE's management see the service
            quality crisis coming before it was too late? What dashboards, KPIs, or predictive
            models would you recommend for an airline CEO managing rapid growth?"
          </p>
          <p className="text-cockpit-muted text-sm mt-3">
            This question connects the simulation experience to Business Intelligence, Analytics,
            and AI topics in the course.
          </p>
        </div>

        {/* Feedback loops reference */}
        <div className="bg-cockpit-panel border border-cockpit-border rounded-xl p-6 mb-6">
          <h3 className="text-sm font-semibold text-cockpit-muted uppercase tracking-wider mb-4">
            Key Feedback Loops in the Model
          </h3>
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="text-green-400 font-medium mb-1">Reinforcing (Growth)</h4>
              <ul className="text-cockpit-text space-y-1">
                <li>R1: Revenue &rarr; Fleet &rarr; Capacity &rarr; Passengers &rarr; Revenue</li>
                <li>R2: Quality &rarr; Reputation &rarr; Demand &rarr; Revenue</li>
                <li>R3: Growth &rarr; Stock Price &rarr; Investment &rarr; Growth</li>
              </ul>
            </div>
            <div>
              <h4 className="text-red-400 font-medium mb-1">Balancing (Limits)</h4>
              <ul className="text-cockpit-text space-y-1">
                <li>B1: Fleet Growth &rarr; Workload &rarr; Burnout &rarr; Turnover</li>
                <li>B2: Demand &rarr; Capacity Constraint &rarr; Lost Passengers</li>
                <li>B3: Market Share &rarr; Competitor Response &rarr; Price War</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex justify-center gap-4">
          <button
            onClick={onBack}
            className="px-6 py-2.5 bg-gray-700 hover:bg-gray-600 text-cockpit-muted
                       rounded-lg transition-colors duration-200"
          >
            Back to Summary
          </button>
          <button
            onClick={onRestart}
            className="px-6 py-2.5 bg-cockpit-accent hover:bg-blue-600 text-white font-semibold
                       rounded-lg transition-colors duration-200"
          >
            Play Again
          </button>
        </div>
      </div>
    </div>
  );
}

// Helper to interpolate historical data
function getHistoricalInterp(quarter: number, field: 'aircraft' | 'revenue' | 'employees'): number | null {
  const points = historicalData.filter(d => d[field] !== undefined);
  if (points.length === 0 || quarter > 24) return null; // historical data only through ~year 6

  if (quarter <= points[0].quarter) return points[0][field] ?? null;
  if (quarter >= points[points.length - 1].quarter) return points[points.length - 1][field] ?? null;

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
  return null;
}
