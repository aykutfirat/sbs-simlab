import { QuarterRecord } from '../types';
import { formatCurrency, formatPercent, quarterLabel } from '../utils/formatting';
import TimeSeriesChart from './charts/TimeSeriesChart';

interface GameOverScreenProps {
  history: QuarterRecord[];
  onRestart: () => void;
  onDebrief: () => void;
}

export default function GameOverScreen({ history, onRestart, onDebrief }: GameOverScreenProps) {
  const finalState = history[history.length - 1].state;
  const isBankrupt = finalState.isBankrupt;

  // Find peak values
  let peakRevenue = 0, peakStockPrice = 0, peakEmployees = 0, peakAircraft = 0;
  for (const h of history) {
    peakRevenue = Math.max(peakRevenue, h.state.revenue);
    peakStockPrice = Math.max(peakStockPrice, h.state.stockPrice);
    peakEmployees = Math.max(peakEmployees, h.state.totalEmployees);
    peakAircraft = Math.max(peakAircraft, h.state.aircraft);
  }

  const revenueData = history.map(h => ({
    label: h.label,
    revenue: h.state.revenue,
    netIncome: h.state.netIncome,
  }));

  return (
    <div className="min-h-screen bg-cockpit-bg flex items-center justify-center p-8">
      <div className="max-w-3xl w-full">
        {/* Header */}
        <div className="text-center mb-8">
          {isBankrupt ? (
            <>
              <h1 className="text-4xl font-bold text-red-400 mb-2">GAME OVER</h1>
              <p className="text-cockpit-muted text-lg">
                People Express has been acquired by Texas Air in {quarterLabel(finalState.quarter)}.
              </p>
            </>
          ) : (
            <>
              <h1 className="text-4xl font-bold text-cockpit-accent mb-2">SIMULATION COMPLETE</h1>
              <p className="text-cockpit-muted text-lg">
                You survived all 10 years. Here's how you did.
              </p>
            </>
          )}
        </div>

        {/* Scorecard */}
        <div className="bg-cockpit-panel border border-cockpit-border rounded-xl p-6 mb-6">
          <h3 className="text-xs font-semibold text-cockpit-muted uppercase tracking-wider mb-4">
            Performance Scorecard
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <ScoreItem label="Quarters Survived" value={`${finalState.quarter} / 40`} />
            <ScoreItem label="Final Revenue" value={`${formatCurrency(finalState.revenue)}/qtr`} />
            <ScoreItem label="Peak Revenue" value={`${formatCurrency(peakRevenue)}/qtr`} />
            <ScoreItem label="Final Net Income" value={formatCurrency(finalState.netIncome)}
                       color={finalState.netIncome >= 0 ? 'text-green-400' : 'text-red-400'} />
            <ScoreItem label="Final Stock Price" value={`$${finalState.stockPrice.toFixed(2)}`} />
            <ScoreItem label="Peak Stock Price" value={`$${peakStockPrice.toFixed(2)}`} />
            <ScoreItem label="Final Employees" value={String(finalState.totalEmployees)} />
            <ScoreItem label="Peak Employees" value={String(Math.round(peakEmployees))} />
            <ScoreItem label="Final Aircraft" value={String(Math.round(finalState.aircraft))} />
            <ScoreItem label="Peak Aircraft" value={String(Math.round(peakAircraft))} />
            <ScoreItem label="Final Morale" value={formatPercent(finalState.employeeMorale)}
                       color={finalState.employeeMorale > 0.5 ? 'text-green-400' : 'text-red-400'} />
            <ScoreItem label="Final Cash" value={formatCurrency(finalState.cash)}
                       color={finalState.cash >= 0 ? 'text-green-400' : 'text-red-400'} />
          </div>
        </div>

        {/* Revenue chart */}
        <div className="mb-6">
          <TimeSeriesChart
            title="Revenue & Net Income Over Time"
            data={revenueData}
            series={[
              { key: 'revenue', name: 'Revenue', color: '#22c55e' },
              { key: 'netIncome', name: 'Net Income', color: '#3b82f6' },
            ]}
            yAxisFormatter={formatCurrency}
            height={250}
          />
        </div>

        {/* Buttons */}
        <div className="flex justify-center gap-4">
          <button
            onClick={onDebrief}
            className="px-6 py-2.5 bg-cockpit-accent hover:bg-blue-600 text-white font-semibold
                       rounded-lg transition-colors duration-200"
          >
            View Debrief Analysis
          </button>
          <button
            onClick={onRestart}
            className="px-6 py-2.5 bg-gray-700 hover:bg-gray-600 text-cockpit-muted
                       rounded-lg transition-colors duration-200"
          >
            Play Again
          </button>
        </div>
      </div>
    </div>
  );
}

function ScoreItem({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div>
      <div className="text-xs text-cockpit-muted">{label}</div>
      <div className={`text-lg font-bold font-mono ${color || 'text-cockpit-text'}`}>{value}</div>
    </div>
  );
}
