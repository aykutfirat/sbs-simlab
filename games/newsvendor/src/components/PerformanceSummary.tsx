import { PerformanceStats } from '../types';
import { formatCurrency, formatPercent, formatNumber } from '../utils/formatting';

interface PerformanceSummaryProps {
  stats: PerformanceStats;
}

export function PerformanceSummary({ stats }: PerformanceSummaryProps) {
  return (
    <div className="bg-white rounded-xl shadow-md p-6 border border-bagel-100">
      <h2 className="text-lg font-bold text-bagel-800 mb-4">Your Performance</h2>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard
          label="Total Profit"
          value={formatCurrency(stats.totalProfit)}
          color={stats.totalProfit >= 0 ? 'green' : 'red'}
          large
        />
        <StatCard
          label="Avg Daily Profit"
          value={formatCurrency(stats.avgDailyProfit)}
          color={stats.avgDailyProfit >= 0 ? 'green' : 'red'}
          large
        />
        <StatCard
          label="Avg Order"
          value={`${formatNumber(stats.avgOrder, 1)} bagels`}
          color="blue"
        />
        <StatCard
          label="Avg Demand"
          value={`${formatNumber(stats.avgDemand, 1)} bagels`}
          color="orange"
          subtitle="(now revealed!)"
        />
        <StatCard
          label="Total Wasted"
          value={`${stats.totalWasted} bagels`}
          color="amber"
        />
        <StatCard
          label="Total Shortage"
          value={`${stats.totalShortage} bagels`}
          color="red"
        />
        <StatCard
          label="Total Sold"
          value={`${stats.totalSold} bagels`}
          color="green"
        />
        <StatCard
          label="Fill Rate"
          value={formatPercent(stats.fillRate)}
          color="blue"
        />
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  color,
  large,
  subtitle,
}: {
  label: string;
  value: string;
  color: string;
  large?: boolean;
  subtitle?: string;
}) {
  const colorMap: Record<string, string> = {
    green: 'bg-green-50 text-green-700',
    red: 'bg-red-50 text-red-700',
    blue: 'bg-blue-50 text-blue-700',
    orange: 'bg-orange-50 text-orange-700',
    amber: 'bg-amber-50 text-amber-700',
  };

  return (
    <div className={`rounded-lg p-3 ${colorMap[color] || 'bg-gray-50 text-gray-700'}`}>
      <div className={`font-bold ${large ? 'text-xl' : 'text-lg'}`}>{value}</div>
      <div className="text-xs mt-1 opacity-80">{label}</div>
      {subtitle && <div className="text-xs italic opacity-60">{subtitle}</div>}
    </div>
  );
}
