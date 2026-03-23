import { SimulationState } from '../types';
import { formatCurrency, formatPercent } from '../utils/formatting';

interface KeyIndicatorsProps {
  state: SimulationState;
}

function indicatorColor(value: number, thresholds: { red: number; yellow: number; green: number; inverse?: boolean }) {
  if (thresholds.inverse) {
    if (value >= thresholds.red) return 'text-red-400';
    if (value >= thresholds.yellow) return 'text-yellow-400';
    return 'text-green-400';
  }
  if (value <= thresholds.red) return 'text-red-400';
  if (value <= thresholds.yellow) return 'text-yellow-400';
  return 'text-green-400';
}

function MiniGauge({ value, label, color }: { value: number; label: string; color: string }) {
  const pct = Math.max(0, Math.min(100, value * 100));
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-cockpit-muted">{label}</span>
        <span className={color}>{formatPercent(value)}</span>
      </div>
      <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${pct}%`,
            backgroundColor: color.includes('red') ? '#ef4444' :
                           color.includes('yellow') ? '#f59e0b' : '#22c55e'
          }}
        />
      </div>
    </div>
  );
}

export default function KeyIndicators({ state }: KeyIndicatorsProps) {
  const cashColor = indicatorColor(state.cash, { red: 0, yellow: 1_000_000, green: 5_000_000 });
  const moraleColor = indicatorColor(state.employeeMorale, { red: 0.3, yellow: 0.5, green: 0.7 });
  const qualityColor = indicatorColor(state.serviceQuality, { red: 0.4, yellow: 0.6, green: 0.8 });

  return (
    <div className="bg-cockpit-panel border border-cockpit-border rounded-lg p-4 space-y-3">
      <h3 className="text-xs font-semibold text-cockpit-muted uppercase tracking-wider">
        Key Indicators
      </h3>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <div className="text-xs text-cockpit-muted">Cash</div>
          <div className={`text-lg font-bold ${cashColor}`}>
            {formatCurrency(state.cash)}
          </div>
        </div>
        <div>
          <div className="text-xs text-cockpit-muted">Stock Price</div>
          <div className="text-lg font-bold text-cockpit-text">
            ${state.stockPrice.toFixed(2)}
          </div>
        </div>
        <div>
          <div className="text-xs text-cockpit-muted">Aircraft</div>
          <div className="text-lg font-bold text-cockpit-text">
            {Math.round(state.aircraft)}
            {state.aircraftOnOrder > 0.5 && (
              <span className="text-xs text-cockpit-muted ml-1">
                (+{Math.round(state.aircraftOnOrder)} on order)
              </span>
            )}
          </div>
        </div>
        <div>
          <div className="text-xs text-cockpit-muted">Employees</div>
          <div className="text-lg font-bold text-cockpit-text">
            {state.totalEmployees}
            {state.employeesInTraining > 0 && (
              <span className="text-xs text-cockpit-muted ml-1">
                ({state.employeesInTraining} training)
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-2 pt-1">
        <MiniGauge value={state.serviceQuality} label="Service Quality" color={qualityColor} />
        <MiniGauge value={state.employeeMorale} label="Employee Morale" color={moraleColor} />
      </div>

      {/* Warning indicators */}
      {state.workload > 1.3 && (
        <div className="flex items-center gap-2 text-xs text-cockpit-warning bg-yellow-900/20 rounded px-2 py-1">
          <span>! Workload: {state.workload.toFixed(2)}x</span>
        </div>
      )}
      {state.cash < 1_000_000 && state.cash >= 0 && (
        <div className="flex items-center gap-2 text-xs text-cockpit-warning bg-yellow-900/20 rounded px-2 py-1">
          <span>! Low cash reserves</span>
        </div>
      )}
      {state.cash < 0 && (
        <div className="flex items-center gap-2 text-xs text-cockpit-danger bg-red-900/20 rounded px-2 py-1">
          <span>! Negative cash - risk of bankruptcy</span>
        </div>
      )}
      {state.employeeMorale < 0.4 && (
        <div className="flex items-center gap-2 text-xs text-cockpit-danger bg-red-900/20 rounded px-2 py-1">
          <span>! Critical morale - high turnover risk</span>
        </div>
      )}
    </div>
  );
}
