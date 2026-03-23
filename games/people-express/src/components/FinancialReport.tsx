import { QuarterRecord } from '../types';
import TimeSeriesChart from './charts/TimeSeriesChart';
import { formatCurrency, formatCurrencyFull } from '../utils/formatting';

interface FinancialReportProps {
  history: QuarterRecord[];
}

export default function FinancialReport({ history }: FinancialReportProps) {
  const data = history.map(h => ({
    label: h.label,
    revenue: h.state.revenue,
    totalCosts: h.state.totalCosts,
    netIncome: h.state.netIncome,
    cash: h.state.cash,
    stockPrice: h.state.stockPrice,
  }));

  const current = history[history.length - 1]?.state;

  return (
    <div className="space-y-4">
      {/* P&L Summary */}
      {current && current.quarter > 0 && (
        <div className="bg-cockpit-panel border border-cockpit-border rounded-lg p-4">
          <h3 className="text-xs font-semibold text-cockpit-muted uppercase tracking-wider mb-3">
            Current Quarter P&L
          </h3>
          <div className="grid grid-cols-2 gap-x-8 gap-y-1 text-sm">
            <div className="text-cockpit-muted">Revenue</div>
            <div className="text-green-400 text-right font-mono">{formatCurrencyFull(current.revenue)}</div>
            <div className="text-cockpit-muted">Aircraft Operating</div>
            <div className="text-red-400 text-right font-mono">-{formatCurrencyFull(current.aircraftCosts)}</div>
            <div className="text-cockpit-muted">Aircraft Purchases</div>
            <div className="text-red-400 text-right font-mono">-{formatCurrencyFull(current.aircraftPurchaseCosts)}</div>
            <div className="text-cockpit-muted">Employee Costs</div>
            <div className="text-red-400 text-right font-mono">-{formatCurrencyFull(current.employeeCosts)}</div>
            <div className="text-cockpit-muted">Marketing</div>
            <div className="text-red-400 text-right font-mono">-{formatCurrencyFull(current.marketingCosts)}</div>
            <div className="text-cockpit-muted">Overhead</div>
            <div className="text-red-400 text-right font-mono">-{formatCurrencyFull(current.overheadCosts)}</div>
            <div className="border-t border-cockpit-border pt-1 text-cockpit-text font-medium">Net Income</div>
            <div className={`border-t border-cockpit-border pt-1 text-right font-mono font-medium ${current.netIncome >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {formatCurrencyFull(current.netIncome)}
            </div>
          </div>
        </div>
      )}

      <TimeSeriesChart
        title="Revenue, Costs & Net Income"
        data={data}
        series={[
          { key: 'revenue', name: 'Revenue', color: '#22c55e' },
          { key: 'totalCosts', name: 'Total Costs', color: '#ef4444' },
          { key: 'netIncome', name: 'Net Income', color: '#3b82f6' },
        ]}
        yAxisFormatter={formatCurrency}
      />

      <TimeSeriesChart
        title="Cash Balance"
        data={data}
        series={[
          { key: 'cash', name: 'Cash', color: '#22c55e' },
        ]}
        yAxisFormatter={formatCurrency}
        referenceLines={[
          { y: 0, label: 'Break Even', color: '#f59e0b' },
          { y: -10_000_000, label: 'Bankruptcy', color: '#ef4444' },
        ]}
      />

      <TimeSeriesChart
        title="Stock Price"
        data={data}
        series={[
          { key: 'stockPrice', name: 'Stock Price', color: '#a78bfa' },
        ]}
        yAxisFormatter={(v) => `$${v.toFixed(2)}`}
      />
    </div>
  );
}
